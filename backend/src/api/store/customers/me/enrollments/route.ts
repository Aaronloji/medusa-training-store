import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: enrollments } = await query.graph({
    entity: "enrollment",
    fields: [
      "id",
      "status",
      "progress_percent",
      "completed_lesson_ids",
      "completed_at",
      "expires_at",
      "certificate_code",
      "created_at",
      "course.id",
      "course.handle",
      "course.title",
      "course.description",
      "course.level",
      "course.certificate_validity_days",
      "course.product.thumbnail",
      // Enrolled customers can access the lesson content.
      "course.lessons.*",
    ],
    filters: { customer_id: req.auth_context.actor_id },
    pagination: { order: { created_at: "DESC" } },
  })

  res.json({ enrollments })
}
