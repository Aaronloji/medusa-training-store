import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { sendNotificationsStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"

type Input = { enrollment_id: string }

/**
 * Sends the certificate email to the learner (email channel → Resend provider)
 * and posts an entry in the admin notifications feed (feed channel → local provider).
 */
export const sendCertificateNotificationWorkflow = createWorkflow(
  "send-certificate-notification",
  (input: Input) => {
    const { data: enrollments } = useQueryGraphStep({
      entity: "enrollment",
      fields: [
        "id",
        "certificate_code",
        "completed_at",
        "expires_at",
        "course.title",
        "customer.email",
        "customer.first_name",
        "customer.last_name",
      ],
      filters: { id: input.enrollment_id },
      options: { throwIfKeyNotFound: true },
    })

    const notifications = transform({ enrollments }, ({ enrollments }) => {
      const e = enrollments[0]
      const name =
        [e.customer?.first_name, e.customer?.last_name].filter(Boolean).join(" ") ||
        e.customer?.email ||
        "Learner"
      const storefront = process.env.STOREFRONT_URL ?? "http://localhost:3000"

      const result: {
        to: string
        channel: string
        template: string
        data: Record<string, unknown>
      }[] = [
        {
          to: "",
          channel: "feed",
          template: "admin-ui",
          data: {
            title: "Certificate issued",
            description: `${name} completed ${e.course?.title} (${e.certificate_code})`,
          },
        },
      ]

      if (e.customer?.email) {
        result.push({
          to: e.customer.email,
          channel: "email",
          template: "certificate-issued",
          data: {
            learner_name: name,
            course_title: e.course?.title,
            certificate_code: e.certificate_code,
            issued_at: e.completed_at,
            expires_at: e.expires_at,
            verify_url: `${storefront}/verify?code=${e.certificate_code}`,
          },
        })
      }
      return result
    })

    const sent = sendNotificationsStep(notifications)

    return new WorkflowResponse(sent)
  }
)
