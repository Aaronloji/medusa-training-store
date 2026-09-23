import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { completeLessonStep, CompleteLessonStepInput } from "./steps/complete-lesson"

export const completeLessonWorkflow = createWorkflow(
  "complete-lesson",
  (input: CompleteLessonStepInput) => {
    const result = completeLessonStep(input)

    // Emitted only the first time the course reaches 100%.
    when({ result }, ({ result }) => result.newly_completed).then(() => {
      const eventData = transform({ result }, ({ result }) => ({
        id: result.enrollment.id,
      }))
      emitEventStep({ eventName: "enrollment.completed", data: eventData })
    })

    const enrollment = transform({ result }, ({ result }) => result.enrollment)

    return new WorkflowResponse(enrollment)
  }
)
