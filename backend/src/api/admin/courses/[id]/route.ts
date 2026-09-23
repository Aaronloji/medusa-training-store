import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { TRAINING_MODULE } from "../../../../modules/training"
import TrainingModuleService from "../../../../modules/training/service"
import { ADMIN_COURSE_FIELDS } from "../route"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "course",
    fields: ADMIN_COURSE_FIELDS,
    filters: { id: req.params.id },
  })

  if (!data.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Course ${req.params.id} was not found`
    )
  }

  res.json({ course: data[0] })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const trainingService: TrainingModuleService = req.scope.resolve(TRAINING_MODULE)

  await trainingService.softDeleteCourses(req.params.id)

  res.json({ id: req.params.id, object: "course", deleted: true })
}
