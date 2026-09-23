import { model } from "@medusajs/framework/utils"
import Course from "./course"

const Lesson = model.define("lesson", {
  id: model.id({ prefix: "lesson" }).primaryKey(),
  title: model.text(),
  position: model.number(),
  duration_minutes: model.number().default(0),
  content_url: model.text().nullable(),
  course: model.belongsTo(() => Course, { mappedBy: "lessons" }),
})

export default Lesson
