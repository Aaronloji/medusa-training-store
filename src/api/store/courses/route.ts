import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Public catalog fields. Lesson `content_url` is intentionally excluded:
// paid content is only exposed through the customer's enrollments.
export const STORE_COURSE_FIELDS = [
  "id",
  "handle",
  "title",
  "description",
  "level",
  "certificate_validity_days",
  "lessons.id",
  "lessons.title",
  "lessons.position",
  "lessons.duration_minutes",
  "product.id",
  "product.handle",
  "product.thumbnail",
]

const LEVELS = ["beginner", "intermediate", "advanced"] as const

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const limit = Math.min(Number(req.query.limit ?? 20), 100)
  const offset = Number(req.query.offset ?? 0)
  const level = LEVELS.find((l) => l === req.query.level)

  const { data: courses, metadata } = await query.graph({
    entity: "course",
    fields: STORE_COURSE_FIELDS,
    filters: {
      is_published: true,
      ...(level && { level }),
    },
    pagination: { skip: offset, take: limit, order: { title: "ASC" } },
  })

  res.json({
    courses,
    count: metadata?.count ?? courses.length,
    limit,
    offset,
  })
}
