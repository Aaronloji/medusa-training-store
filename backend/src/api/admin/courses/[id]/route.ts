import type {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { TRAINING_MODULE } from "../../../../modules/training"
import TrainingModuleService from "../../../../modules/training/service"
import { updateCourseWorkflow } from "../../../../workflows/update-course"
import type { PostAdminUpdateCourseType } from "../../../validators"
import { ADMIN_COURSE_FIELDS } from "../route"

async function getCourse(req: MedusaRequest, id: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "course",
    fields: ADMIN_COURSE_FIELDS,
    filters: { id },
  })
  if (!data.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Course ${id} was not found`)
  }
  return data[0]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json({ course: await getCourse(req, req.params.id) })
}

export async function POST(
  req: AuthenticatedMedusaRequest<PostAdminUpdateCourseType>,
  res: MedusaResponse
) {
  // Fails with 404 before running the workflow if the course doesn't exist.
  await getCourse(req, req.params.id)

  await updateCourseWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })

  res.json({ course: await getCourse(req, req.params.id) })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const trainingService: TrainingModuleService = req.scope.resolve(TRAINING_MODULE)

  await trainingService.softDeleteCourses(req.params.id)

  res.json({ id: req.params.id, object: "course", deleted: true })
}
