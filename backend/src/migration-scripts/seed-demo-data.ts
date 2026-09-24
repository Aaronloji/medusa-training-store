import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { seedDemoData } from "../scripts/demo-data"

/**
 * Migration script: runs once on deploy (tracked by Medusa) and fills every
 * admin section with realistic demo data. Errors are logged, never thrown,
 * so a problem with demo data can't block a deployment.
 */
export default async function seedDemoDataMigration({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    await seedDemoData(container)
  } catch (e) {
    logger.error(`[demo-data] Failed: ${(e as Error).message}`)
  }
}
