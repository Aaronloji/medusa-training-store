export type Level = "beginner" | "intermediate" | "advanced"

export type AdminLesson = {
  id: string
  title: string
  position: number
  duration_minutes: number
  content_url: string | null
}

export type AdminEnrollment = {
  id: string
  status: "active" | "completed" | "expired"
  progress_percent: number
  created_at: string
  customer?: { email: string; first_name: string | null; last_name: string | null } | null
}

export type AdminCourse = {
  id: string
  handle: string
  title: string
  description: string | null
  level: Level
  certificate_validity_days: number | null
  is_published: boolean
  created_at: string
  lessons?: AdminLesson[]
  enrollments?: AdminEnrollment[]
  product?: { id: string; title: string } | null
}

export type CourseFormValues = {
  title: string
  description: string | null
  level: Level
  certificate_validity_days: number | null
  is_published: boolean
}

export type NewCourseValues = CourseFormValues & {
  handle: string
  product_id?: string
  lessons: { title: string; duration_minutes: number }[]
}
