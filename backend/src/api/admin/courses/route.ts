import type {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createCourseWorkflow } from "../../../workflows/create-course"
import type { PostAdminCreateCourseType } from "../../validators"

export const ADMIN_COURSE_FIELDS = [
  "*",
  "lessons.*",
  "product.id",
  "product.title",
  "enrollments.id",
  "enrollments.status",
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const limit = Math.min(Number(req.query.limit ?? 50), 200)
  const offset = Number(req.query.offset ?? 0)

  const { data: courses, metadata } = await query.graph({
    entity: "course",
    fields: ADMIN_COURSE_FIELDS,
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
  })

  res.json({ courses, count: metadata?.count ?? courses.length, limit, offset })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminCreateCourseType>,
  res: MedusaResponse
) {
  const { result } = await createCourseWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "course",
    fields: ADMIN_COURSE_FIELDS,
    filters: { id: result.id },
  })

  res.status(201).json({ course: data[0] })
}
