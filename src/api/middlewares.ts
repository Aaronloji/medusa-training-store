import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { PostAdminCreateCourse, PostStoreCompleteLesson } from "./validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/courses",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateCourse)],
    },
    {
      matcher: "/store/customers/me/enrollments*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/customers/me/enrollments/:id/complete-lesson",
      method: "POST",
      middlewares: [validateAndTransformBody(PostStoreCompleteLesson)],
    },
  ],
})
