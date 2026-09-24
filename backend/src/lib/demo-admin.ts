import type {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Public, read-only admin account so reviewers can explore the dashboard.
 * The credentials are intentionally published in the README.
 */
export const DEMO_ADMIN = {
  email: "demo.admin@example.com",
  password: "demo1234",
}

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

let demoAdminId: string | null | undefined

async function getDemoAdminId(req: AuthenticatedMedusaRequest) {
  if (demoAdminId === undefined) {
    const userService = req.scope.resolve(Modules.USER)
    const [user] = await userService.listUsers({ email: DEMO_ADMIN.email })
    // Only cache once the user exists, so a later-created demo user is still picked up.
    if (user) {
      demoAdminId = user.id
    }
    return user?.id ?? null
  }
  return demoAdminId
}

/**
 * Blocks every write request (POST/PUT/PATCH/DELETE) made by the demo admin,
 * so the public account can browse the whole dashboard but never change data.
 */
export async function blockDemoAdminWrites(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  if (READ_METHODS.has(req.method) || req.auth_context?.actor_type !== "user") {
    return next()
  }

  const demoId = await getDemoAdminId(req)
  if (demoId && req.auth_context.actor_id === demoId) {
    return res.status(403).json({
      type: "not_allowed",
      message: "This is a read-only demo account. Changes are disabled.",
    })
  }

  next()
}
