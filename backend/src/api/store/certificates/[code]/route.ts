import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

/**
 * Public certificate verification: employers and auditors can confirm that a
 * certificate code is genuine and still valid. Only non-sensitive data is exposed.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const code = req.params.code.trim().toUpperCase()

  const { data } = await query.graph({
    entity: "enrollment",
    fields: [
      "certificate_code",
      "status",
      "completed_at",
      "expires_at",
      "course.title",
      "customer.first_name",
      "customer.last_name",
    ],
    filters: { certificate_code: code },
  })

  const enrollment = data[0]
  if (!enrollment) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Certificate ${code} was not found`)
  }

  const isExpired =
    enrollment.status === "expired" ||
    (!!enrollment.expires_at && new Date(enrollment.expires_at) < new Date())

  res.json({
    certificate: {
      code: enrollment.certificate_code,
      holder: [enrollment.customer?.first_name, enrollment.customer?.last_name]
        .filter(Boolean)
        .join(" "),
      course: enrollment.course?.title,
      issued_at: enrollment.completed_at,
      expires_at: enrollment.expires_at,
      valid: !isExpired,
    },
  })
}
