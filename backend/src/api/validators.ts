import { z } from "@medusajs/framework/zod"

export const PostAdminCreateCourse = z.object({
  handle: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Handle must be lowercase, numbers and dashes"),
  title: z.string().min(1),
  description: z.string().nullish(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  certificate_validity_days: z.number().int().positive().nullish(),
  is_published: z.boolean().optional(),
  product_id: z.string().optional(),
  lessons: z
    .array(
      z.object({
        title: z.string().min(1),
        duration_minutes: z.number().int().nonnegative().optional(),
        content_url: z.string().url().nullish(),
      })
    )
    .optional(),
})

export type PostAdminCreateCourseType = z.infer<typeof PostAdminCreateCourse>

export const PostStoreCompleteLesson = z.object({
  lesson_id: z.string().min(1),
})

export type PostStoreCompleteLessonType = z.infer<typeof PostStoreCompleteLesson>
