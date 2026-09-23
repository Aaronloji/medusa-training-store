import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { TRAINING_MODULE } from "../modules/training"
import TrainingModuleService from "../modules/training/service"

/**
 * Compliance certificates have a validity period. Every night, mark the
 * completed enrollments whose certificate has expired so customers are
 * prompted to retake (and re-purchase) the course.
 */
export default async function expireCertificatesJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const trainingService: TrainingModuleService = container.resolve(TRAINING_MODULE)

  const expired = await trainingService.listEnrollments(
    {
      status: "completed",
      expires_at: { $lte: new Date() },
    },
    { select: ["id"] }
  )

  if (!expired.length) {
    return
  }

  await trainingService.updateEnrollments(
    expired.map((e) => ({ id: e.id, status: "expired" as const }))
  )

  logger.info(`Marked ${expired.length} certificate(s) as expired`)
}

export const config = {
  name: "expire-certificates",
  schedule: "0 2 * * *", // every day at 02:00
}
