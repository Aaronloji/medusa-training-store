import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getPricingContext, STORE_COURSE_FIELDS } from "./helpers"

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
    context: await getPricingContext(req),
  })

  res.json({
    courses,
    count: metadata?.count ?? courses.length,
    limit,
    offset,
  })
}
