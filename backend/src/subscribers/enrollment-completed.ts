import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Fired by the complete-lesson workflow when a customer finishes a course.
 * This is where a certificate email would be sent through the Notification
 * Module (e.g. SendGrid / Resend provider) once one is configured.
 */
export default async function enrollmentCompletedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: enrollments } = await query.graph({
    entity: "enrollment",
    fields: ["id", "certificate_code", "expires_at", "course.title", "customer.email"],
    filters: { id: data.id },
  })
  const enrollment = enrollments[0]
  if (!enrollment) {
    return
  }

  logger.info(
    `Certificate ${enrollment.certificate_code} issued to ${
      enrollment.customer?.email ?? "customer"
    } for "${enrollment.course?.title}"`
  )
}

export const config: SubscriberConfig = {
  event: "enrollment.completed",
}
