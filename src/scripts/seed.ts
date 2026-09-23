import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
} from "@medusajs/medusa/core-flows"
import { createCourseWorkflow } from "../workflows/create-course"

const COURSES = [
  {
    handle: "osha-10-construction",
    title: "OSHA 10-Hour Construction",
    description: "Entry-level safety and health training for construction workers.",
    level: "beginner" as const,
    certificate_validity_days: 5 * 365,
    price: 89,
    lessons: [
      { title: "Introduction to OSHA", duration_minutes: 60 },
      { title: "Focus Four: Falls", duration_minutes: 90 },
      { title: "Focus Four: Electrocution", duration_minutes: 60 },
      { title: "Personal Protective Equipment", duration_minutes: 45 },
    ],
  },
  {
    handle: "hipaa-for-healthcare-workers",
    title: "HIPAA Training for Healthcare Workers",
    description: "Protect patient privacy and comply with the HIPAA Privacy & Security Rules.",
    level: "intermediate" as const,
    certificate_validity_days: 365,
    price: 39,
    lessons: [
      { title: "What is PHI?", duration_minutes: 30 },
      { title: "The Privacy Rule", duration_minutes: 40 },
      { title: "The Security Rule", duration_minutes: 40 },
      { title: "Breach Notification", duration_minutes: 20 },
    ],
  },
  {
    handle: "food-handler-certificate",
    title: "Food Handler Certificate",
    description: "Food safety fundamentals required for restaurant and food-service staff.",
    level: "beginner" as const,
    certificate_validity_days: 3 * 365,
    price: 15,
    lessons: [
      { title: "Foodborne Illness", duration_minutes: 25 },
      { title: "Time & Temperature Control", duration_minutes: 30 },
      { title: "Cleaning and Sanitizing", duration_minutes: 25 },
    ],
  },
]

export default async function seedTrainingData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const regionService = container.resolve(Modules.REGION)

  // Sales channel & region (reused if they already exist).
  let [salesChannel] = await salesChannelService.listSalesChannels({
    name: "Default Sales Channel",
  })
  if (!salesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: "Default Sales Channel" }] },
    })
    salesChannel = result[0]
  }

  const [existingRegion] = await regionService.listRegions({ currency_code: "usd" })
  if (!existingRegion) {
    await createRegionsWorkflow(container).run({
      input: {
        regions: [{ name: "United States", currency_code: "usd", countries: ["us"] }],
      },
    })
  }

  for (const { price, ...course } of COURSES) {
    // Courses are digital: one "Online access" variant, no inventory to manage.
    const { result: products } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: course.title,
            handle: course.handle,
            description: course.description,
            status: ProductStatus.PUBLISHED,
            sales_channels: [{ id: salesChannel.id }],
            options: [{ title: "Access", values: ["Online"] }],
            variants: [
              {
                title: "Online access",
                sku: course.handle.toUpperCase(),
                manage_inventory: false,
                options: { Access: "Online" },
                prices: [{ amount: price, currency_code: "usd" }],
              },
            ],
          },
        ],
      },
    })

    await createCourseWorkflow(container).run({
      input: { ...course, is_published: true, product_id: products[0].id },
    })

    logger.info(`Seeded course "${course.title}"`)
  }

  logger.info("Finished seeding training catalog.")
}
