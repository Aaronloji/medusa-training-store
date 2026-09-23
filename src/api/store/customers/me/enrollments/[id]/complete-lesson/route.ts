import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { completeLessonWorkflow } from "../../../../../../../workflows/complete-lesson"
import type { PostStoreCompleteLessonType } from "../../../../../../validators"

export async function POST(
  req: AuthenticatedMedusaRequest<PostStoreCompleteLessonType>,
  res: MedusaResponse
) {
  const { result: enrollment } = await completeLessonWorkflow(req.scope).run({
    input: {
      enrollment_id: req.params.id,
      lesson_id: req.validatedBody.lesson_id,
      customer_id: req.auth_context.actor_id,
    },
  })

  res.json({ enrollment })
}
