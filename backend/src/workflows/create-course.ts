import { Modules } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { TRAINING_MODULE } from "../modules/training"
import { createCourseStep, CreateCourseStepInput } from "./steps/create-course"

export type CreateCourseWorkflowInput = CreateCourseStepInput & {
  /** Optional product that sells this course. */
  product_id?: string
}

export const createCourseWorkflow = createWorkflow(
  "create-course",
  (input: CreateCourseWorkflowInput) => {
    const courseData = transform({ input }, ({ input }) => {
      const { product_id, ...rest } = input
      return rest
    })

    const course = createCourseStep(courseData)

    when({ input }, ({ input }) => !!input.product_id).then(() => {
      const links = transform({ input, course }, ({ input, course }) => [
        {
          [Modules.PRODUCT]: { product_id: input.product_id },
          [TRAINING_MODULE]: { course_id: course.id },
        },
      ])
      createRemoteLinkStep(links)
    })

    return new WorkflowResponse(course)
  }
)
