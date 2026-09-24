import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createUserAccountWorkflow } from "@medusajs/medusa/core-flows"
import { DEMO_ADMIN } from "../lib/demo-admin"

/**
 * Migration script: runs once during `medusa db:migrate` and is tracked by Medusa,
 * so the public read-only demo admin exists on every environment without a shell.
 */
export default async function createDemoAdmin({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const userService = container.resolve(Modules.USER)
  const authService = container.resolve(Modules.AUTH)

  const [existing] = await userService.listUsers({ email: DEMO_ADMIN.email })
  if (existing) {
    logger.info("Demo admin already exists, skipping.")
    return
  }

  const { authIdentity, error } = await authService.register("emailpass", {
    body: DEMO_ADMIN,
  })
  if (error || !authIdentity) {
    throw new Error(`Could not register the demo admin: ${error}`)
  }

  await createUserAccountWorkflow(container).run({
    input: {
      authIdentityId: authIdentity.id,
      userData: { email: DEMO_ADMIN.email, first_name: "Demo", last_name: "Reviewer" },
    },
  })

  logger.info(`Read-only demo admin created: ${DEMO_ADMIN.email}`)
}
