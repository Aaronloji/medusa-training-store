import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  addToCartWorkflow,
  completeCartWorkflow,
  createCartWorkflow,
} from "@medusajs/medusa/core-flows"
import { TRAINING_MODULE } from "../../modules/training"
import TrainingModuleService from "../../modules/training/service"

/**
 * Throws if the customer already has an active or completed enrollment in
 * any course sold by the given products. Expired certificates can be renewed.
 */
export async function assertCoursesNotOwned(
  container: MedusaContainer,
  customerId: string | null | undefined,
  productIds: string[]
) {
  if (!customerId || !productIds.length) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "course.id", "course.title"],
    filters: { id: productIds },
  })
  const courses = products
    .map((p) => p.course)
    .filter((c): c is NonNullable<typeof c> => !!c?.id)
  if (!courses.length) {
    return
  }

  const trainingService: TrainingModuleService = container.resolve(TRAINING_MODULE)
  const owned = await trainingService.listEnrollments({
    customer_id: customerId,
    course_id: courses.map((c) => c.id),
    status: ["active", "completed"],
  })
  if (owned.length) {
    const title = courses.find((c) => c.id === owned[0].course_id)?.title ?? "this course"
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `You already have access to "${title}". Continue it from My learning.`
    )
  }
}

async function getCartCustomer(container: MedusaContainer, cartId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "customer_id", "items.product_id"],
    filters: { id: cartId },
  })
  return data[0]
}

// Storefront checkout creates the cart with its items in one call.
createCartWorkflow.hooks.validate(async ({ cart }, { container }) => {
  const items = (cart.items ?? []) as { product_id?: string | null }[]
  await assertCoursesNotOwned(
    container,
    cart.customer_id,
    items.map((i) => i.product_id).filter((id): id is string => !!id)
  )
})

// Block adding an owned course to an existing cart.
addToCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  const cart = await getCartCustomer(container, input.cart_id)
  const variantIds = (input.items ?? [])
    .map((i) => ("variant_id" in i ? i.variant_id : undefined))
    .filter((id): id is string => !!id)
  if (!cart || !variantIds.length) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["product_id"],
    filters: { id: variantIds },
  })
  await assertCoursesNotOwned(
    container,
    cart.customer_id,
    variants.map((v) => v.product_id).filter((id): id is string => !!id)
  )
})

// Final guard at checkout: the cart may have been created before login,
// or the course bought in another tab in the meantime. It blocks the order,
// but the error surfaces as a generic 500 because the in-memory workflow engine
// hits a checkpoint conflict while compensating completeCartWorkflow, so the
// hooks above give the user-facing message.
completeCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  const cart = await getCartCustomer(container, input.id)
  if (!cart) {
    return
  }
  await assertCoursesNotOwned(
    container,
    cart.customer_id,
    (cart.items ?? []).map((i) => i?.product_id).filter((id): id is string => !!id)
  )
})
