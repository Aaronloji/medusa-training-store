import { sdk } from "./medusa"
import type { CertificateVerification, Course, Enrollment, Level } from "./types"

export async function listCourses(regionId?: string, level?: Level) {
  const { courses } = await sdk.client.fetch<{ courses: Course[] }>("/store/courses", {
    query: { region_id: regionId, level, limit: 50 },
  })
  return courses
}

export async function getCourse(handle: string, regionId?: string) {
  const { course } = await sdk.client.fetch<{ course: Course }>(
    `/store/courses/${handle}`,
    { query: { region_id: regionId } }
  )
  return course
}

export async function listEnrollments() {
  const { enrollments } = await sdk.client.fetch<{ enrollments: Enrollment[] }>(
    "/store/customers/me/enrollments"
  )
  return enrollments
}

export async function completeLesson(enrollmentId: string, lessonId: string) {
  const { enrollment } = await sdk.client.fetch<{ enrollment: Enrollment }>(
    `/store/customers/me/enrollments/${enrollmentId}/complete-lesson`,
    { method: "POST", body: { lesson_id: lessonId } }
  )
  return enrollment
}

export async function verifyCertificate(code: string) {
  const { certificate } = await sdk.client.fetch<{ certificate: CertificateVerification }>(
    `/store/certificates/${encodeURIComponent(code)}`
  )
  return certificate
}

/**
 * Buys a single course with Medusa's standard cart → payment → order flow.
 * Courses are digital products, so no shipping method is required.
 */
export async function purchaseCourse({
  regionId,
  variantId,
  email,
  firstName,
  lastName,
}: {
  regionId: string
  variantId: string
  email: string
  firstName: string
  lastName: string
}) {
  const { cart } = await sdk.store.cart.create({
    region_id: regionId,
    email,
    items: [{ variant_id: variantId, quantity: 1 }],
  })

  const { cart: updated } = await sdk.store.cart.update(cart.id, {
    billing_address: {
      first_name: firstName,
      last_name: lastName,
      country_code: "us",
    },
  })

  // Built-in manual provider: authorizes the payment without charging a card.
  await sdk.store.payment.initiatePaymentSession(updated, {
    provider_id: "pp_system_default",
  })

  const result = await sdk.store.cart.complete(cart.id)
  if (result.type !== "order") {
    throw new Error(result.error?.message ?? "The order could not be placed")
  }
  return result.order
}

/**
 * Enrollment is created asynchronously by the `order.placed` subscriber,
 * so poll briefly until it shows up.
 */
export async function waitForEnrollment(courseId: string, attempts = 15) {
  for (let i = 0; i < attempts; i++) {
    const enrollments = await listEnrollments()
    const match = enrollments.find(
      (e) => e.course.id === courseId && e.status !== "expired"
    )
    if (match) return match
    await new Promise((r) => setTimeout(r, 1000))
  }
  return null
}
