import { model } from "@medusajs/framework/utils"
import Lesson from "./lesson"
import Enrollment from "./enrollment"

const Course = model
  .define("course", {
    id: model.id({ prefix: "course" }).primaryKey(),
    handle: model.text().unique(),
    title: model.text().searchable(),
    description: model.text().nullable(),
    level: model.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
    // Compliance certificates (OSHA, HIPAA, food safety...) usually expire.
    // null = the certificate never expires.
    certificate_validity_days: model.number().nullable(),
    is_published: model.boolean().default(false),
    lessons: model.hasMany(() => Lesson, { mappedBy: "course" }),
    enrollments: model.hasMany(() => Enrollment, { mappedBy: "course" }),
  })
  .cascades({ delete: ["lessons"] })

export default Course
