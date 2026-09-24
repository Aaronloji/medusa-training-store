import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createCustomerAccountWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createUserAccountWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  updateRegionsWorkflow,
} from "@medusajs/medusa/core-flows"
import { createCourseWorkflow } from "../workflows/create-course"

const DEMO_CUSTOMER = { email: "demo@learner.com", password: "demo1234" }

export const COURSES = [
  {
    handle: "osha-10-construction",
    title: "OSHA 10-Hour Construction",
    description:
      "Entry-level safety and health training for construction workers. Learn to recognize, avoid and prevent job-site hazards.",
    level: "beginner" as const,
    certificate_validity_days: 5 * 365,
    price: 89,
    thumbnail: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80",
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
    description:
      "Protect patient privacy and comply with the HIPAA Privacy & Security Rules. Required annually for most healthcare staff.",
    level: "intermediate" as const,
    certificate_validity_days: 365,
    price: 39,
    thumbnail: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80",
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
    description:
      "Food safety fundamentals required for restaurant and food-service staff: illness prevention, temperature control and sanitation.",
    level: "beginner" as const,
    certificate_validity_days: 3 * 365,
    price: 15,
    thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&q=80",
    lessons: [
      { title: "Foodborne Illness", duration_minutes: 25 },
      { title: "Time & Temperature Control", duration_minutes: 30 },
      { title: "Cleaning and Sanitizing", duration_minutes: 25 },
    ],
  },
  {
    handle: "forklift-operator-safety",
    title: "Forklift Operator Safety",
    description:
      "Classroom portion of powered industrial truck training: stability, load handling and pre-shift inspections.",
    level: "advanced" as const,
    certificate_validity_days: 3 * 365,
    price: 59,
    thumbnail: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80",
    lessons: [
      { title: "Forklift Fundamentals", duration_minutes: 35 },
      { title: "The Stability Triangle", duration_minutes: 30 },
      { title: "Load Handling", duration_minutes: 40 },
      { title: "Pre-shift Inspection", duration_minutes: 20 },
      { title: "Pedestrian Safety", duration_minutes: 25 },
    ],
  },
  {
    handle: "hazard-communication-ghs",
    title: "Hazard Communication (GHS)",
    description:
      "Understand chemical labels, Safety Data Sheets and pictograms under OSHA's Hazard Communication Standard.",
    level: "beginner" as const,
    certificate_validity_days: 365,
    price: 29,
    thumbnail: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=1200&q=80",
    lessons: [
      { title: "Your Right to Know", duration_minutes: 20 },
      { title: "Reading GHS Labels", duration_minutes: 25 },
      { title: "Safety Data Sheets", duration_minutes: 30 },
      { title: "Safe Handling & Storage", duration_minutes: 25 },
    ],
  },
  {
    handle: "bloodborne-pathogens",
    title: "Bloodborne Pathogens",
    description:
      "OSHA-required annual training on HIV, HBV and HCV exposure prevention for healthcare and first-aid responders.",
    level: "intermediate" as const,
    certificate_validity_days: 365,
    price: 25,
    thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80",
    lessons: [
      { title: "Understanding Bloodborne Diseases", duration_minutes: 25 },
      { title: "Exposure Control Plans", duration_minutes: 20 },
      { title: "Personal Protective Equipment", duration_minutes: 20 },
      { title: "Post-Exposure Procedures", duration_minutes: 15 },
    ],
  },
  {
    handle: "hot-work-welding-safety",
    title: "Hot Work & Welding Safety",
    description:
      "Prevent fires, burns and toxic fume exposure during welding, cutting and brazing operations.",
    level: "advanced" as const,
    certificate_validity_days: 2 * 365,
    price: 69,
    thumbnail: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=80",
    lessons: [
      { title: "Hot Work Permits", duration_minutes: 30 },
      { title: "Fire Watch Duties", duration_minutes: 25 },
      { title: "Fumes and Ventilation", duration_minutes: 35 },
      { title: "Welding PPE", duration_minutes: 25 },
      { title: "Confined Space Considerations", duration_minutes: 30 },
    ],
  },
  {
    handle: "workplace-harassment-prevention",
    title: "Workplace Harassment Prevention",
    description:
      "Recognize, prevent and report harassment and discrimination. Meets state requirements for employees and supervisors.",
    level: "beginner" as const,
    certificate_validity_days: 2 * 365,
    price: 35,
    thumbnail: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=80",
    lessons: [
      { title: "What Counts as Harassment", duration_minutes: 30 },
      { title: "Bystander Intervention", duration_minutes: 25 },
      { title: "Reporting and Retaliation", duration_minutes: 20 },
      { title: "Responsibilities of Supervisors", duration_minutes: 25 },
    ],
  },
  {
    handle: "cybersecurity-awareness",
    title: "Cybersecurity Awareness for Employees",
    description:
      "Spot phishing, protect sensitive data and build secure habits. A common requirement for SOC 2 and HIPAA programs.",
    level: "beginner" as const,
    certificate_validity_days: 365,
    price: 19,
    thumbnail: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80",
    lessons: [
      { title: "Phishing and Social Engineering", duration_minutes: 20 },
      { title: "Passwords and MFA", duration_minutes: 15 },
      { title: "Handling Sensitive Data", duration_minutes: 20 },
      { title: "Reporting Incidents", duration_minutes: 10 },
    ],
  },
]

/**
 * Idempotent seed: safe to run more than once (e.g. on every deploy).
 */
export default async function seedTrainingData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const regionService = container.resolve(Modules.REGION)
  const apiKeyService = container.resolve(Modules.API_KEY)
  const customerService = container.resolve(Modules.CUSTOMER)
  const authService = container.resolve(Modules.AUTH)

  // Sales channel
  let [salesChannel] = await salesChannelService.listSalesChannels({
    name: "Default Sales Channel",
  })
  if (!salesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: "Default Sales Channel" }] },
    })
    salesChannel = result[0]
  }

  // Region with the built-in manual payment provider (no real card is charged)
  const [region] = await regionService.listRegions({ currency_code: "usd" })
  if (!region) {
    await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "United States",
            currency_code: "usd",
            countries: ["us"],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    })
  } else {
    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: { payment_providers: ["pp_system_default"] },
      },
    })
  }

  // Publishable API key for the storefront
  let [apiKey] = await apiKeyService.listApiKeys({ title: "Storefront", type: "publishable" })
  if (!apiKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: { api_keys: [{ title: "Storefront", type: "publishable", created_by: "" }] },
    })
    apiKey = result[0]
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: apiKey.id, add: [salesChannel.id] },
    })
  }

  // Courses + the products that sell them
  for (const { price, thumbnail, ...course } of COURSES) {
    const { data: existing } = await query.graph({
      entity: "product",
      fields: ["id"],
      filters: { handle: course.handle },
    })
    if (existing.length) {
      continue
    }

    // Digital product: no shipping profile and no inventory, so checkout skips shipping.
    const { result: products } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: course.title,
            handle: course.handle,
            description: course.description,
            thumbnail,
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

  // Demo learner account so reviewers can try the storefront right away
  const [demoCustomer] = await customerService.listCustomers({
    email: DEMO_CUSTOMER.email,
    has_account: true,
  })
  if (!demoCustomer) {
    const { authIdentity, error } = await authService.register("emailpass", {
      body: DEMO_CUSTOMER,
    })
    if (error || !authIdentity) {
      throw new Error(`Could not register demo customer: ${error}`)
    }
    await createCustomerAccountWorkflow(container).run({
      input: {
        authIdentityId: authIdentity.id,
        customerData: { email: DEMO_CUSTOMER.email, first_name: "Demo", last_name: "Learner" },
      },
    })
    logger.info(`Demo customer: ${DEMO_CUSTOMER.email} / ${DEMO_CUSTOMER.password}`)
  }

  // Optional admin user from env vars (hosts without a shell can't run `medusa user`)
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    const userService = container.resolve(Modules.USER)
    const [existingAdmin] = await userService.listUsers({ email: adminEmail })
    if (!existingAdmin) {
      const { authIdentity, error } = await authService.register("emailpass", {
        body: { email: adminEmail, password: adminPassword },
      })
      if (error || !authIdentity) {
        throw new Error(`Could not register admin user: ${error}`)
      }
      await createUserAccountWorkflow(container).run({
        input: { authIdentityId: authIdentity.id, userData: { email: adminEmail } },
      })
      logger.info(`Admin user created: ${adminEmail}`)
    }
  }

  logger.info(`Publishable API key: ${apiKey.token}`)
  logger.info("Finished seeding training catalog.")
}
