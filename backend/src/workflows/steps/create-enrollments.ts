import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { TRAINING_MODULE } from "../../modules/training"
import TrainingModuleService from "../../modules/training/service"

export type CreateEnrollmentsStepInput = {
  customer_id: string
  course_id: string
  order_id?: string | null
}[]

export const createEnrollmentsStep = createStep(
  "create-enrollments",
  async (input: CreateEnrollmentsStepInput, { container }) => {
    if (!input.length) {
      return new StepResponse([], [] as string[])
    }

    const trainingService: TrainingModuleService = container.resolve(TRAINING_MODULE)

    // Idempotency: skip courses the customer already has an active/completed
    // enrollment for, so re-processing the same order never duplicates access.
    const existing = await trainingService.listEnrollments({
      customer_id: input.map((i) => i.customer_id),
      course_id: input.map((i) => i.course_id),
      status: ["active", "completed"],
    })
    const alreadyEnrolled = new Set(existing.map((e) => `${e.customer_id}:${e.course_id}`))

    const toCreate = input.filter(
      (i) => !alreadyEnrolled.has(`${i.customer_id}:${i.course_id}`)
    )
    if (!toCreate.length) {
      return new StepResponse([], [] as string[])
    }

    const enrollments = await trainingService.createEnrollments(toCreate)

    return new StepResponse(
      enrollments,
      enrollments.map((e) => e.id)
    )
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) {
      return
    }
    const trainingService: TrainingModuleService = container.resolve(TRAINING_MODULE)
    await trainingService.deleteEnrollments(createdIds)
  }
)
