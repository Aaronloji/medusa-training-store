import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { getPricingContext, STORE_COURSE_FIELDS } from "../helpers"

// Accepts either the course id (course_...) or its handle.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  const { data } = await query.graph({
    entity: "course",
    fields: STORE_COURSE_FIELDS,
    filters: {
      is_published: true,
      ...(id.startsWith("course_") ? { id } : { handle: id }),
    },
    context: await getPricingContext(req),
  })

  if (!data.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Course ${id} was not found`)
  }

  res.json({ course: data[0] })
}
