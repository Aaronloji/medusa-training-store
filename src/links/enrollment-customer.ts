import { defineLink } from "@medusajs/framework/utils"
import CustomerModule from "@medusajs/medusa/customer"
import TrainingModule from "../modules/training"

// Read-only link: lets Query resolve `enrollment.customer` from the
// customer_id column without creating a pivot table.
export default defineLink(
  {
    linkable: TrainingModule.linkable.enrollment,
    field: "customer_id",
  },
  CustomerModule.linkable.customer,
  { readOnly: true }
)
