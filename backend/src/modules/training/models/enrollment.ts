import { model } from "@medusajs/framework/utils"
import Course from "./course"

const Enrollment = model.define("enrollment", {
  id: model.id({ prefix: "enrl" }).primaryKey(),
  customer_id: model.text().index(),
  order_id: model.text().nullable(),
  status: model.enum(["active", "completed", "expired"]).default("active"),
  progress_percent: model.number().default(0),
  completed_lesson_ids: model.json().nullable(),
  completed_at: model.dateTime().nullable(),
  expires_at: model.dateTime().nullable(),
  certificate_code: model.text().nullable(),
  course: model.belongsTo(() => Course, { mappedBy: "enrollments" }),
})

export default Enrollment
