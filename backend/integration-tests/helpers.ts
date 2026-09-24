import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createUserAccountWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
} from "@medusajs/medusa/core-flows"
import { createCourseWorkflow } from "../src/workflows/create-course"

type Api = {
  get: (url: string, config?: object) => Promise<any>
  post: (url: string, body?: object, config?: object) => Promise<any>
  delete: (url: string, config?: object) => Promise<any>
}

/** Returns the axios response even for 4xx/5xx, so tests can assert on status. */
export const settle = (request: Promise<any>) =>
  request.catch((e) => {
    if (!e.response) throw e
    return e.response
  })

/**
 * Minimal store: USD region with the manual payment provider, a sales channel,
 * a publishable key, and one published course sold as a digital product.
 */
export async function createStoreFixture(container: MedusaContainer) {
  const {
    result: [salesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: { salesChannelsData: [{ name: "Test channel" }] },
  })
  const {
    result: [region],
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "US",
          currency_code: "usd",
          countries: ["us"],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  })
  const {
    result: [apiKey],
  } = await createApiKeysWorkflow(container).run({
    input: { api_keys: [{ title: "Test key", type: "publishable", created_by: "" }] },
  })
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: apiKey.id, add: [salesChannel.id] },
  })

  const {
    result: [product],
  } = await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "HIPAA Basics",
          handle: "hipaa-basics",
          status: ProductStatus.PUBLISHED,
          sales_channels: [{ id: salesChannel.id }],
          options: [{ title: "Access", values: ["Online"] }],
          variants: [
            {
              title: "Online access",
              manage_inventory: false,
              options: { Access: "Online" },
              prices: [{ amount: 40, currency_code: "usd" }],
            },
          ],
        },
      ],
    },
  })

  const { result: course } = await createCourseWorkflow(container).run({
    input: {
      handle: "hipaa-basics",
      title: "HIPAA Basics",
      level: "beginner",
      certificate_validity_days: 365,
      is_published: true,
      product_id: product.id,
      lessons: [
        { title: "What is PHI?", duration_minutes: 20 },
        { title: "The Privacy Rule", duration_minutes: 30 },
      ],
    },
  })

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "course",
    fields: ["lessons.id", "lessons.position"],
    filters: { id: course.id },
  })
  const lessonIds = [...(data[0].lessons ?? [])]
    .sort((a, b) => a!.position - b!.position)
    .map((l) => l!.id)

  return {
    region,
    salesChannel,
    publishableKey: apiKey.token,
    product,
    variantId: product.variants[0].id,
    course,
    lessonIds,
  }
}

export async function createAdminToken(
  container: MedusaContainer,
  api: Api,
  email = "admin@test.com",
  password = "secret-password"
) {
  const authService = container.resolve(Modules.AUTH)
  const { authIdentity } = await authService.register("emailpass", {
    body: { email, password },
  })
  await createUserAccountWorkflow(container).run({
    input: { authIdentityId: authIdentity!.id, userData: { email } },
  })
  const { data } = await api.post("/auth/user/emailpass", { email, password })
  return { authorization: `Bearer ${data.token}` }
}

/** Registers a storefront customer and returns headers for store requests. */
export async function createCustomerHeaders(api: Api, publishableKey: string, email: string) {
  const password = "customer-password"
  const keyHeader = { "x-publishable-api-key": publishableKey }

  const { data: registration } = await api.post(
    "/auth/customer/emailpass/register",
    { email, password },
    { headers: keyHeader }
  )
  await api.post(
    "/store/customers",
    { email, first_name: "Test", last_name: "Learner" },
    { headers: { ...keyHeader, authorization: `Bearer ${registration.token}` } }
  )
  const { data: login } = await api.post(
    "/auth/customer/emailpass",
    { email, password },
    { headers: keyHeader }
  )
  return { ...keyHeader, authorization: `Bearer ${login.token}` }
}

/** Standard storefront checkout: cart → payment session → complete. */
export async function checkout(
  api: Api,
  headers: Record<string, string>,
  regionId: string,
  variantId: string
) {
  const {
    data: { cart },
  } = await api.post(
    "/store/carts",
    { region_id: regionId, items: [{ variant_id: variantId, quantity: 1 }] },
    { headers }
  )
  const {
    data: { payment_collection },
  } = await api.post("/store/payment-collections", { cart_id: cart.id }, { headers })
  await api.post(
    `/store/payment-collections/${payment_collection.id}/payment-sessions`,
    { provider_id: "pp_system_default" },
    { headers }
  )
  return settle(api.post(`/store/carts/${cart.id}/complete`, {}, { headers }))
}

/** Subscribers run asynchronously after events; poll until the condition holds. */
export async function waitFor<T>(fn: () => Promise<T | null | undefined>, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    const result = await fn()
    if (result) return result
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error("Condition not met in time")
}
