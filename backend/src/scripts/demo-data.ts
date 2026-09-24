import type { ExecArgs, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  capturePaymentWorkflow,
  completeCartWorkflow,
  createCampaignsWorkflow,
  createCartWorkflow,
  createCollectionsWorkflow,
  createCustomerAddressesWorkflow,
  createCustomerGroupsWorkflow,
  createCustomersWorkflow,
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductTagsWorkflow,
  createProductTypesWorkflow,
  createPromotionsWorkflow,
  createReturnReasonsWorkflow,
  createSalesChannelsWorkflow,
  createStoresWorkflow,
  linkCustomersToCustomerGroupWorkflow,
  linkProductsToSalesChannelWorkflow,
  updateProductsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import { TRAINING_MODULE } from "../modules/training"
import TrainingModuleService from "../modules/training/service"
import { completeLessonWorkflow } from "../workflows/complete-lesson"
import { enrollCustomerFromOrderWorkflow } from "../workflows/enroll-customer-from-order"
import seedTrainingData, { COURSES } from "./seed"

const DAY_MS = 24 * 60 * 60 * 1000
const PRICE_BY_HANDLE = new Map(COURSES.map((c) => [c.handle, c.price]))

const CATEGORIES: Record<string, string[]> = {
  "Workplace Safety": [
    "osha-10-construction",
    "forklift-operator-safety",
    "hazard-communication-ghs",
    "hot-work-welding-safety",
  ],
  "Healthcare Compliance": ["hipaa-for-healthcare-workers", "bloodborne-pathogens"],
  "Food Safety": ["food-handler-certificate"],
  "HR & Corporate": ["workplace-harassment-prevention", "cybersecurity-awareness"],
}

const COLLECTIONS: Record<string, string[]> = {
  "New Hire Essentials": [
    "osha-10-construction",
    "food-handler-certificate",
    "workplace-harassment-prevention",
    "cybersecurity-awareness",
  ],
  "Annual Renewals": [
    "hipaa-for-healthcare-workers",
    "bloodborne-pathogens",
    "hazard-communication-ghs",
  ],
}

const TAGS: Record<string, string[]> = {
  OSHA: [
    "osha-10-construction",
    "forklift-operator-safety",
    "hazard-communication-ghs",
    "bloodborne-pathogens",
    "hot-work-welding-safety",
  ],
  "Annual requirement": [
    "hipaa-for-healthcare-workers",
    "bloodborne-pathogens",
    "hazard-communication-ghs",
    "cybersecurity-awareness",
  ],
  "State approved": ["food-handler-certificate", "workplace-harassment-prevention"],
  Bestseller: ["osha-10-construction", "hipaa-for-healthcare-workers", "food-handler-certificate"],
}

type Group = "healthcare" | "construction" | "hospitality" | null

const CUSTOMERS: {
  first: string
  last: string
  company: string
  city: string
  state: string
  group: Group
}[] = [
  { first: "Olivia", last: "Martinez", company: "Sunrise Medical Group", city: "Phoenix", state: "AZ", group: "healthcare" },
  { first: "James", last: "Carter", company: "Carter Builders LLC", city: "Dallas", state: "TX", group: "construction" },
  { first: "Sophia", last: "Nguyen", company: "Pho Real Kitchen", city: "San Jose", state: "CA", group: "hospitality" },
  { first: "Michael", last: "Brooks", company: "Brooks Steel Works", city: "Pittsburgh", state: "PA", group: "construction" },
  { first: "Emma", last: "Johnson", company: "Lakeside Dental", city: "Chicago", state: "IL", group: "healthcare" },
  { first: "Daniel", last: "Kim", company: "Harbor Logistics", city: "Seattle", state: "WA", group: null },
  { first: "Ava", last: "Patel", company: "Evergreen Pediatrics", city: "Portland", state: "OR", group: "healthcare" },
  { first: "Ethan", last: "Rivera", company: "Rivera Roofing", city: "Miami", state: "FL", group: "construction" },
  { first: "Mia", last: "Thompson", company: "The Corner Bistro", city: "Boston", state: "MA", group: "hospitality" },
  { first: "Lucas", last: "Anderson", company: "Northwind Tech", city: "Denver", state: "CO", group: null },
  { first: "Isabella", last: "Garcia", company: "St. Mary's Clinic", city: "San Antonio", state: "TX", group: "healthcare" },
  { first: "Noah", last: "Wilson", company: "Wilson Fabrication", city: "Detroit", state: "MI", group: "construction" },
  { first: "Charlotte", last: "Lee", company: "Blue Plate Diner", city: "Atlanta", state: "GA", group: "hospitality" },
  { first: "Liam", last: "Scott", company: "Summit Warehousing", city: "Salt Lake City", state: "UT", group: null },
]

/**
 * Orders placed through the real cart → payment → order flow.
 * `progress`: lessons completed per course (Infinity = whole course).
 */
const ORDERS: {
  customer: number
  courses: string[]
  daysAgo: number
  promo?: string
  capture?: boolean
  progress?: number[]
}[] = [
  { customer: 0, courses: ["hipaa-for-healthcare-workers", "bloodborne-pathogens"], daysAgo: 58, capture: true, progress: [Infinity, Infinity] },
  { customer: 1, courses: ["osha-10-construction"], daysAgo: 52, capture: true, progress: [Infinity] },
  { customer: 2, courses: ["food-handler-certificate"], daysAgo: 47, promo: "WELCOME5", capture: true, progress: [Infinity] },
  { customer: 3, courses: ["hot-work-welding-safety", "osha-10-construction"], daysAgo: 41, capture: true, progress: [Infinity, 2] },
  { customer: 4, courses: ["hipaa-for-healthcare-workers"], daysAgo: 36, capture: true, progress: [3] },
  { customer: 5, courses: ["forklift-operator-safety"], daysAgo: 30, promo: "SAFETY10", capture: true, progress: [Infinity] },
  { customer: 6, courses: ["bloodborne-pathogens", "cybersecurity-awareness"], daysAgo: 26, capture: true, progress: [Infinity, 1] },
  { customer: 7, courses: ["osha-10-construction", "hazard-communication-ghs"], daysAgo: 21, promo: "SAFETY10", capture: true, progress: [2, Infinity] },
  { customer: 8, courses: ["food-handler-certificate", "workplace-harassment-prevention"], daysAgo: 17, capture: true, progress: [Infinity, 0] },
  { customer: 9, courses: ["cybersecurity-awareness"], daysAgo: 13, capture: true, progress: [Infinity] },
  { customer: 10, courses: ["hipaa-for-healthcare-workers", "workplace-harassment-prevention"], daysAgo: 9, capture: true, progress: [1, 0] },
  { customer: 11, courses: ["hot-work-welding-safety"], daysAgo: 6, capture: false, progress: [0] },
  { customer: 12, courses: ["food-handler-certificate"], daysAgo: 3, promo: "WELCOME5", capture: true, progress: [2] },
  { customer: 13, courses: ["forklift-operator-safety", "hazard-communication-ghs"], daysAgo: 1, capture: false, progress: [0, 0] },
]

/**
 * Populates every admin section with realistic demo data using Medusa's own
 * workflows. Resumable: each section only creates what is still missing.
 */
export async function seedDemoData(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const customerService = container.resolve(Modules.CUSTOMER)
  const productService = container.resolve(Modules.PRODUCT)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const orderService = container.resolve(Modules.ORDER)
  const promotionService = container.resolve(Modules.PROMOTION)
  const pricingService = container.resolve(Modules.PRICING)

  // Each section is isolated: a failure is logged and the rest keeps going.
  const section = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn()
      logger.info(`[demo-data] ${name}: done`)
    } catch (e) {
      logger.warn(`[demo-data] ${name}: skipped (${(e as Error).message})`)
    }
  }

  // Base catalog, region, sales channel and publishable key.
  await seedTrainingData({ container } as ExecArgs)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id"],
  })
  const productByHandle = new Map(products.map((p) => [p.handle, p]))
  const idsFor = (handles: string[]) =>
    handles.map((h) => productByHandle.get(h)?.id).filter((id): id is string => !!id)

  const { data: regions } = await query.graph({ entity: "region", fields: ["id"] })
  const regionId = regions[0].id
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const defaultChannel = channels.find((c) => c.name === "Default Sales Channel") ?? channels[0]

  await section("Store settings", async () => {
    const { data: stores } = await query.graph({ entity: "store", fields: ["id"] })
    if (stores[0]) {
      await updateStoresWorkflow(container).run({
        input: { selector: { id: stores[0].id }, update: { name: "CertPath" } },
      })
    } else {
      // Fresh database: the server only creates the default store on first boot.
      await createStoresWorkflow(container).run({
        input: {
          stores: [
            { name: "CertPath", supported_currencies: [{ currency_code: "usd", is_default: true }] },
          ],
        },
      })
    }
  })

  await section("Catalog taxonomy", async () => {
    const existing = await productService.listProductCategories({ name: "Workplace Safety" })
    if (existing.length) return
    const { result: categories } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: Object.keys(CATEGORIES).map((name) => ({
          name,
          is_active: true,
          is_internal: false,
        })),
      },
    })
    const { result: collections } = await createCollectionsWorkflow(container).run({
      input: { collections: Object.keys(COLLECTIONS).map((title) => ({ title })) },
    })
    const { result: tags } = await createProductTagsWorkflow(container).run({
      input: { product_tags: Object.keys(TAGS).map((value) => ({ value })) },
    })
    const { result: types } = await createProductTypesWorkflow(container).run({
      input: { product_types: [{ value: "Online course" }] },
    })

    for (const product of products) {
      const categoryIds = categories
        .filter((c) => CATEGORIES[c.name]?.includes(product.handle))
        .map((c) => c.id)
      const collection = collections.find((c) => COLLECTIONS[c.title]?.includes(product.handle))
      const tagIds = tags.filter((t) => TAGS[t.value]?.includes(product.handle)).map((t) => t.id)

      await updateProductsWorkflow(container).run({
        input: {
          selector: { id: product.id },
          update: {
            category_ids: categoryIds,
            collection_id: collection?.id,
            tag_ids: tagIds,
            type_id: types[0].id,
          },
        },
      })
    }
  })

  await section("B2B sales channel", async () => {
    const existing = await salesChannelService.listSalesChannels({ name: "B2B Portal" })
    if (existing.length) return
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          { name: "B2B Portal", description: "Bulk seat purchases for employers" },
        ],
      },
    })
    await linkProductsToSalesChannelWorkflow(container).run({
      input: { id: result[0].id, add: products.map((p) => p.id) },
    })
  })

  await section("Return reasons", async () => {
    const existing = await orderService.listReturnReasons({ value: "not_needed" })
    if (existing.length) return
    await createReturnReasonsWorkflow(container).run({
      input: {
        data: [
          { value: "not_needed", label: "Course no longer needed" },
          { value: "purchased_by_mistake", label: "Purchased by mistake" },
          { value: "employer_paid", label: "Employer purchased it instead" },
        ],
      },
    })
  })

  // Customers, addresses and B2B groups
  const customerIds: string[] = []
  const groupIds: Partial<Record<Exclude<Group, null>, string>> = {}

  await section("Customers", async () => {
    const emailOf = (c: (typeof CUSTOMERS)[number]) => `${c.first}.${c.last}@example.com`.toLowerCase()
    const existing = await customerService.listCustomers({ email: CUSTOMERS.map(emailOf) })
    const idByEmail = new Map(existing.map((c) => [c.email, c.id]))
    const missing = CUSTOMERS.map((c, i) => ({ c, i })).filter(({ c }) => !idByEmail.has(emailOf(c)))

    if (missing.length) {
      const { result } = await createCustomersWorkflow(container).run({
        input: {
          customersData: missing.map(({ c, i }) => ({
            first_name: c.first,
            last_name: c.last,
            email: emailOf(c),
            company_name: c.company,
            phone: `+1 555 01${String(i).padStart(2, "0")}`,
          })),
        },
      })
      result.forEach((created) => idByEmail.set(created.email, created.id))
    }
    customerIds.push(...CUSTOMERS.map((c) => idByEmail.get(emailOf(c))!))
    if (!missing.length) return

    await createCustomerAddressesWorkflow(container).run({
      input: {
        addresses: missing.map(({ c, i }) => ({
          customer_id: customerIds[i],
          first_name: c.first,
          last_name: c.last,
          company: c.company,
          address_1: `${100 + i * 17} Main Street`,
          city: c.city,
          province: c.state,
          postal_code: String(10000 + i * 731).slice(0, 5),
          country_code: "us",
          is_default_billing: true,
        })),
      },
    })
  })

  await section("Customer groups", async () => {
    const names = ["Healthcare employers", "Construction companies", "Restaurants & hospitality"]
    const existing = await customerService.listCustomerGroups({ name: { $in: names } })
    if (existing.length === names.length) {
      const idOf = (name: string) => existing.find((g) => g.name === name)!.id
      groupIds.healthcare = idOf(names[0])
      groupIds.construction = idOf(names[1])
      groupIds.hospitality = idOf(names[2])
      return
    }
    const { result } = await createCustomerGroupsWorkflow(container).run({
      input: {
        customersData: [
          { name: "Healthcare employers" },
          { name: "Construction companies" },
          { name: "Restaurants & hospitality" },
        ],
      },
    })
    groupIds.healthcare = result[0].id
    groupIds.construction = result[1].id
    groupIds.hospitality = result[2].id

    for (const [key, groupId] of Object.entries(groupIds)) {
      const members = CUSTOMERS.map((c, i) => (c.group === key ? customerIds[i] : null)).filter(
        (id): id is string => !!id
      )
      await linkCustomersToCustomerGroupWorkflow(container).run({
        input: { id: groupId!, add: members },
      })
    }
  })

  await section("Promotions & campaign", async () => {
    const existing = await promotionService.listPromotions({ code: "SAFETY10" })
    if (existing.length) return
    const { result: campaigns } = await createCampaignsWorkflow(container).run({
      input: {
        campaignsData: [
          {
            name: "Workplace Safety Month",
            campaign_identifier: "SAFETY-MONTH",
            description: "Discounts on OSHA and workplace safety training.",
            starts_at: new Date(Date.now() - 60 * DAY_MS),
            ends_at: new Date(Date.now() + 30 * DAY_MS),
            budget: { type: "usage", limit: 500 },
          },
        ],
      },
    })

    await createPromotionsWorkflow(container).run({
      input: {
        promotionsData: [
          {
            code: "SAFETY10",
            type: "standard",
            status: "active",
            is_automatic: false,
            campaign_id: campaigns[0].id,
            application_method: {
              type: "percentage",
              target_type: "order",
              allocation: "across",
              value: 10,
              currency_code: "usd",
            },
          },
          {
            code: "WELCOME5",
            type: "standard",
            status: "active",
            is_automatic: false,
            application_method: {
              type: "fixed",
              target_type: "order",
              allocation: "across",
              value: 5,
              currency_code: "usd",
            },
          },
          {
            code: "HEALTHCARE20",
            type: "standard",
            status: "active",
            is_automatic: false,
            application_method: {
              type: "percentage",
              target_type: "items",
              allocation: "each",
              max_quantity: 1,
              value: 20,
              currency_code: "usd",
              target_rules: [
                {
                  attribute: "items.product.id",
                  operator: "in",
                  values: idsFor(CATEGORIES["Healthcare Compliance"]),
                },
              ],
            },
          },
        ],
      },
    })
  })

  await section("B2B price list", async () => {
    const existing = await pricingService.listPriceLists({}, { select: ["id", "title"] })
    if (existing.some((p) => p.title === "B2B volume pricing")) return
    const groups = Object.values(groupIds).filter(Boolean) as string[]
    await createPriceListsWorkflow(container).run({
      input: {
        price_lists_data: [
          {
            title: "B2B volume pricing",
            description: "20% off every course for employer accounts.",
            status: "active",
            ...(groups.length && { rules: { "customer.groups.id": groups } }),
            prices: products.filter((p) => PRICE_BY_HANDLE.has(p.handle)).flatMap((p) =>
              (p.variants ?? []).map((v) => ({
                variant_id: v.id,
                currency_code: "usd",
                amount: Math.round((PRICE_BY_HANDLE.get(p.handle) ?? 0) * 0.8),
              }))
            ),
          },
        ],
      },
    })
  })

  await section("Orders, payments & enrollments", async () => {
    const trainingService: TrainingModuleService = container.resolve(TRAINING_MODULE)

    for (const order of ORDERS) {
      try {
        const customerId = customerIds[order.customer]
        const c = CUSTOMERS[order.customer]
        if (!customerId) continue
        const email = `${c.first}.${c.last}@example.com`.toLowerCase()
        const previous = await orderService.listOrders({ customer_id: customerId }, { take: 1 })
        if (previous.length) continue

        const { result: cart } = await createCartWorkflow(container).run({
          input: {
            region_id: regionId,
            sales_channel_id: defaultChannel.id,
            customer_id: customerId,
            email,
            promo_codes: order.promo ? [order.promo] : undefined,
            billing_address: {
              first_name: c.first,
              last_name: c.last,
              company: c.company,
              city: c.city,
              province: c.state,
              country_code: "us",
            },
            items: order.courses.map((handle) => ({
              variant_id: productByHandle.get(handle)!.variants![0]!.id,
              quantity: 1,
            })),
          },
        })

        await createPaymentCollectionForCartWorkflow(container).run({
          input: { cart_id: cart.id },
        })
        const { data: carts } = await query.graph({
          entity: "cart",
          fields: ["payment_collection.id"],
          filters: { id: cart.id },
        })
        await createPaymentSessionsWorkflow(container).run({
          input: {
            payment_collection_id: carts[0].payment_collection!.id,
            provider_id: "pp_system_default",
          },
        })
        const { result: placed } = await completeCartWorkflow(container).run({
          input: { id: cart.id },
        })
        const orderId = placed.id

        if (order.capture) {
          const { data: orders } = await query.graph({
            entity: "order",
            fields: ["payment_collections.payments.id"],
            filters: { id: orderId },
          })
          const paymentId = orders[0].payment_collections?.[0]?.payments?.[0]?.id
          if (paymentId) {
            await capturePaymentWorkflow(container).run({ input: { payment_id: paymentId } })
          }
        }

        // The order.placed subscriber does this in the app; call it directly here.
        await enrollCustomerFromOrderWorkflow(container).run({ input: { order_id: orderId } })

        // Learner progress
        const placedAt = new Date(Date.now() - order.daysAgo * DAY_MS)
        for (const [i, handle] of order.courses.entries()) {
          const enrollment = await findEnrollment(trainingService, customerId, handle, query)
          if (!enrollment) continue

          const target = order.progress?.[i] ?? 0
          const { data: courses } = await query.graph({
            entity: "course",
            fields: ["lessons.id", "lessons.position"],
            filters: { handle },
          })
          const lessons = [...(courses[0]?.lessons ?? [])]
            .filter((l): l is NonNullable<typeof l> => !!l)
            .sort((a, b) => a.position - b.position)
          for (const lesson of lessons.slice(0, Math.min(target, lessons.length))) {
            await completeLessonWorkflow(container).run({
              input: { enrollment_id: enrollment.id, lesson_id: lesson.id, customer_id: customerId },
            })
          }

          // Spread the timeline realistically across the past weeks.
          const completedAt = new Date(placedAt.getTime() + 2 * DAY_MS)
          await knex("enrollment")
            .where({ id: enrollment.id })
            .update({ created_at: placedAt, updated_at: completedAt })
          await knex("enrollment")
            .where({ id: enrollment.id })
            .whereNotNull("completed_at")
            .update({
              completed_at: completedAt,
              expires_at: knex.raw(
                "CASE WHEN expires_at IS NULL THEN NULL ELSE ?::timestamptz + (expires_at - completed_at) END",
                [completedAt]
              ),
            })
        }

        await knex("order").where({ id: orderId }).update({ created_at: placedAt, updated_at: placedAt })
        await knex("customer")
          .where({ id: customerId })
          .andWhere("created_at", ">", new Date(placedAt.getTime() - 3 * DAY_MS))
          .update({ created_at: new Date(placedAt.getTime() - 3 * DAY_MS) })
      } catch (e) {
        // One bad order should not stop the rest of the demo timeline.
        logger.warn(`[demo-data] Order for customer #${order.customer} skipped (${(e as Error).message})`)
      }
    }
  })

  await section("Expired certificate example", async () => {
    // A HIPAA certificate earned 14 months ago: past its 1-year validity.
    const trainingService: TrainingModuleService = container.resolve(TRAINING_MODULE)
    const enrollment = await findEnrollment(
      trainingService,
      customerIds[0],
      "hipaa-for-healthcare-workers",
      query
    )
    if (!enrollment) return
    const completedAt = new Date(Date.now() - 425 * DAY_MS)
    await knex("enrollment")
      .where({ id: enrollment.id })
      .update({
        created_at: new Date(completedAt.getTime() - 3 * DAY_MS),
        completed_at: completedAt,
        expires_at: new Date(completedAt.getTime() + 365 * DAY_MS),
        status: "expired",
      })
  })

  await section("Demo learner progress", async () => {
    // Give the public demo learner one certificate and one course in progress.
    const [demo] = await customerService.listCustomers({ email: "demo@learner.com" })
    if (!demo) return
    const demoOrders: { courses: string[]; progress: number[] }[] = [
      { courses: ["food-handler-certificate", "cybersecurity-awareness"], progress: [Infinity, 2] },
    ]
    const trainingService: TrainingModuleService = container.resolve(TRAINING_MODULE)
    const existing = await trainingService.listEnrollments({ customer_id: demo.id })
    if (existing.length) return
    for (const o of demoOrders) {
      const { data: courses } = await query.graph({
        entity: "course",
        fields: ["id", "handle", "lessons.id", "lessons.position"],
        filters: { handle: o.courses },
      })
      for (const [i, handle] of o.courses.entries()) {
        const course = courses.find((c) => c.handle === handle)
        if (!course) continue
        const [enrollment] = await trainingService.createEnrollments([
          { customer_id: demo.id, course_id: course.id },
        ])
        const lessons = [...(course.lessons ?? [])]
          .filter((l): l is NonNullable<typeof l> => !!l)
          .sort((a, b) => a.position - b.position)
        for (const lesson of lessons.slice(0, Math.min(o.progress[i], lessons.length))) {
          await completeLessonWorkflow(container).run({
            input: { enrollment_id: enrollment.id, lesson_id: lesson.id, customer_id: demo.id },
          })
        }
      }
    }
  })

  logger.info("[demo-data] Finished populating demo data.")
}

async function findEnrollment(
  trainingService: TrainingModuleService,
  customerId: string,
  handle: string,
  query: { graph: (...args: any[]) => Promise<{ data: any[] }> }
) {
  const { data: courses } = await query.graph({
    entity: "course",
    fields: ["id"],
    filters: { handle },
  })
  if (!courses[0]) return null
  const [enrollment] = await trainingService.listEnrollments(
    { customer_id: customerId, course_id: courses[0].id },
    { order: { created_at: "DESC" } }
  )
  return enrollment ?? null
}

export default async function run({ container }: ExecArgs) {
  await seedDemoData(container)
}
