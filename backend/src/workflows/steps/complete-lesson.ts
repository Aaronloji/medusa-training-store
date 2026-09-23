import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { TRAINING_MODULE } from "../../modules/training"
import TrainingModuleService from "../../modules/training/service"
import {
  applyLessonCompletion,
  computeCertificateExpiry,
  generateCertificateCode,
} from "../../utils/progress"

export type CompleteLessonStepInput = {
  enrollment_id: string
  lesson_id: string
  customer_id: string
}

export const completeLessonStep = createStep(
  "complete-lesson",
  async (input: CompleteLessonStepInput, { container }) => {
    const trainingService: TrainingModuleService = container.resolve(TRAINING_MODULE)

    const enrollment = await trainingService.retrieveEnrollment(input.enrollment_id, {
      relations: ["course", "course.lessons"],
    })

    // Never reveal other customers' enrollments.
    if (enrollment.customer_id !== input.customer_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Enrollment with id: ${input.enrollment_id} was not found`
      )
    }
    if (enrollment.status === "expired") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This enrollment has expired. Purchase the course again to renew it."
      )
    }

    const lessonIds = [...enrollment.course.lessons]
      .sort((a, b) => a.position - b.position)
      .map((l) => l.id)

    let progress: ReturnType<typeof applyLessonCompletion>
    try {
      progress = applyLessonCompletion(
        enrollment.completed_lesson_ids as unknown as string[] | null,
        input.lesson_id,
        lessonIds
      )
    } catch (e) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, (e as Error).message)
    }

    const newlyCompleted = progress.is_complete && enrollment.status !== "completed"
    const completedAt = new Date()

    const previous = {
      id: enrollment.id,
      completed_lesson_ids: enrollment.completed_lesson_ids,
      progress_percent: enrollment.progress_percent,
      status: enrollment.status,
      completed_at: enrollment.completed_at,
      expires_at: enrollment.expires_at,
      certificate_code: enrollment.certificate_code,
    }

    const updated = await trainingService.updateEnrollments({
      id: enrollment.id,
      completed_lesson_ids: progress.completed_lesson_ids as unknown as Record<string, unknown>,
      progress_percent: progress.progress_percent,
      ...(newlyCompleted && {
        status: "completed" as const,
        completed_at: completedAt,
        expires_at: computeCertificateExpiry(
          completedAt,
          enrollment.course.certificate_validity_days
        ),
        certificate_code: generateCertificateCode(enrollment.id, completedAt),
      }),
    })

    return new StepResponse({ enrollment: updated, newly_completed: newlyCompleted }, previous)
  },
  // Compensation: restore the enrollment exactly as it was.
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const trainingService: TrainingModuleService = container.resolve(TRAINING_MODULE)
    await trainingService.updateEnrollments(previous)
  }
)
