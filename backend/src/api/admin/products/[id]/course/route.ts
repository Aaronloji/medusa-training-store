import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Used by the product details admin widget: resolves the course linked to a product.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "course.*", "course.lessons.*", "course.enrollments.status"],
    filters: { id: req.params.id },
  })

  res.json({ course: data[0]?.course ?? null })
}
