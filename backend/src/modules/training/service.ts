import { MedusaService } from "@medusajs/framework/utils"
import Course from "./models/course"
import Lesson from "./models/lesson"
import Enrollment from "./models/enrollment"

/**
 * MedusaService generates CRUD methods for every data model
 * (createCourses, listAndCountCourses, updateEnrollments, ...).
 */
class TrainingModuleService extends MedusaService({
  Course,
  Lesson,
  Enrollment,
}) {}

export default TrainingModuleService
