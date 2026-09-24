import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { TRAINING_MODULE } from "../modules/training"
import TrainingModuleService from "../modules/training/service"

export type UpdateCourseInput = {
  id: string
  title?: string
  description?: string | null
  level?: "beginner" | "intermediate" | "advanced"
  certificate_validity_days?: number | null
  is_published?: boolean
}

const UPDATABLE = [
  "title",
  "description",
  "level",
  "certificate_validity_days",
  "is_published",
] as const

export const updateCourseStep = createStep(
  "update-course",
  async (input: UpdateCourseInput, { container }) => {
    const trainingService: TrainingModuleService = container.resolve(TRAINING_MODULE)

    const previous = await trainingService.retrieveCourse(input.id, {
      select: ["id", ...UPDATABLE],
    })
    const course = await trainingService.updateCourses(input)

    return new StepResponse(course, previous)
  },
  // Compensation: restore the previous values if a later step fails.
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const trainingService: TrainingModuleService = container.resolve(TRAINING_MODULE)
    await trainingService.updateCourses({
      id: previous.id,
      title: previous.title,
      description: previous.description,
      level: previous.level,
      certificate_validity_days: previous.certificate_validity_days,
      is_published: previous.is_published,
    })
  }
)

export const updateCourseWorkflow = createWorkflow(
  "update-course",
  (input: UpdateCourseInput) => {
    const course = updateCourseStep(input)
    return new WorkflowResponse(course)
  }
)
