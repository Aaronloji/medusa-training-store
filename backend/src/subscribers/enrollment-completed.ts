import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendCertificateNotificationWorkflow } from "../workflows/send-certificate-notification"

/**
 * Fired by the complete-lesson workflow when a learner finishes a course:
 * emails the certificate and notifies admins in the dashboard feed.
 */
export default async function enrollmentCompletedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    await sendCertificateNotificationWorkflow(container).run({
      input: { enrollment_id: data.id },
    })
  } catch (e) {
    // A notification failure must never undo the learner's progress.
    logger.error(`Certificate notification failed for ${data.id}: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: "enrollment.completed",
}
