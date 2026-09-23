import type { MedusaRequest } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  QueryContext,
} from "@medusajs/framework/utils"

// Public catalog fields. Lesson `content_url` is intentionally excluded:
// paid content is only exposed through the customer's enrollments.
export const STORE_COURSE_FIELDS = [
  "id",
  "handle",
  "title",
  "description",
  "level",
  "certificate_validity_days",
  "lessons.id",
  "lessons.title",
  "lessons.position",
  "lessons.duration_minutes",
  "product.id",
  "product.handle",
  "product.thumbnail",
  "product.variants.id",
  "product.variants.calculated_price.calculated_amount",
  "product.variants.calculated_price.currency_code",
]

/**
 * Query context so Medusa's Pricing Module resolves the variant price
 * for the storefront's region (currency, price lists, rules...).
 * Falls back to the first region when the client doesn't send `region_id`,
 * because calculated prices always need a currency.
 */
export async function getPricingContext(req: MedusaRequest) {
  const regionId = req.query.region_id as string | undefined

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
    filters: regionId ? { id: regionId } : {},
    pagination: { take: 1 },
  })
  if (!regions.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      regionId ? `Region ${regionId} was not found` : "No region is configured"
    )
  }

  return {
    product: {
      variants: {
        calculated_price: QueryContext({
          region_id: regions[0].id,
          currency_code: regions[0].currency_code,
        }),
      },
    },
  }
}
