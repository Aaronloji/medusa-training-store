import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { createEnrollmentsStep } from "./steps/create-enrollments"

type Input = { order_id: string }

/**
 * Grants course access for every course-linked product in an order.
 * Triggered by the `order.placed` subscriber.
 */
export const enrollCustomerFromOrderWorkflow = createWorkflow(
  "enroll-customer-from-order",
  (input: Input) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: ["id", "customer_id", "items.product_id"],
      filters: { id: input.order_id },
      options: { throwIfKeyNotFound: true },
    })

    const productIds = transform({ orders }, ({ orders }) => {
      const items = (orders[0]?.items ?? []) as { product_id?: string | null }[]
      return [...new Set(items.map((i) => i?.product_id).filter(Boolean))] as string[]
    })

    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "course.id"],
      filters: { id: productIds },
    }).config({ name: "fetch-course-products" })

    const enrollmentsInput = transform({ orders, products }, ({ orders, products }) => {
      const order = orders[0]
      if (!order?.customer_id) {
        return []
      }
      return (products as { course?: { id: string } | null }[])
        .filter((p) => !!p.course?.id)
        .map((p) => ({
          customer_id: order.customer_id as string,
          course_id: p.course!.id,
          order_id: order.id as string,
        }))
    })

    const enrollments = createEnrollmentsStep(enrollmentsInput)

    return new WorkflowResponse(enrollments)
  }
)
