import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import TrainingModule from "../modules/training"

// A product in the catalog is the sellable "seat" for a course.
export default defineLink(
  ProductModule.linkable.product,
  TrainingModule.linkable.course
)
