import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { TRAINING_MODULE } from "../../modules/training"
import TrainingModuleService from "../../modules/training/service"

export type CreateCourseStepInput = {
  handle: string
  title: string
  description?: string | null
  level?: "beginner" | "intermediate" | "advanced"
  certificate_validity_days?: number | null
  is_published?: boolean
  lessons?: {
    title: string
    duration_minutes?: number
    content_url?: string | null
  }[]
}

export const createCourseStep = createStep(
  "create-course",
  async ({ lessons = [], ...courseData }: CreateCourseStepInput, { container }) => {
    const trainingService: TrainingModuleService = container.resolve(TRAINING_MODULE)

    const course = await trainingService.createCourses(courseData)

    if (lessons.length) {
      await trainingService.createLessons(
        lessons.map((lesson, index) => ({
          ...lesson,
          position: index + 1,
          course_id: course.id,
        }))
      )
    }

    return new StepResponse(course, course.id)
  },
  // Compensation: roll back if a later step fails (lessons cascade on delete).
  async (courseId, { container }) => {
    if (!courseId) {
      return
    }
    const trainingService: TrainingModuleService = container.resolve(TRAINING_MODULE)
    await trainingService.deleteCourses(courseId)
  }
)
