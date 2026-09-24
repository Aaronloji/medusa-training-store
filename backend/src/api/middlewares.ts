import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { blockDemoAdminWrites } from "../lib/demo-admin"
import { PostAdminCreateCourse, PostStoreCompleteLesson } from "./validators"

export default defineMiddlewares({
  routes: [
    {
      // Resolve the admin session (if any) so the demo account can be detected.
      // allowUnauthenticated keeps public admin routes such as invite acceptance working.
      matcher: "/admin/*",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"], {
          allowUnauthenticated: true,
        }),
        blockDemoAdminWrites,
      ],
    },
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
