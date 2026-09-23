import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { enrollCustomerFromOrderWorkflow } from "../workflows/enroll-customer-from-order"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  const { result } = await enrollCustomerFromOrderWorkflow(container).run({
    input: { order_id: data.id },
  })

  if (result.length) {
    logger.info(`Order ${data.id}: created ${result.length} course enrollment(s)`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
