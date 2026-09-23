export type AdminLesson = {
  id: string
  title: string
  position: number
  duration_minutes: number
  content_url: string | null
}

export type AdminCourse = {
  id: string
  handle: string
  title: string
  description: string | null
  level: "beginner" | "intermediate" | "advanced"
  certificate_validity_days: number | null
  is_published: boolean
  created_at: string
  lessons?: AdminLesson[]
  enrollments?: { id: string; status: "active" | "completed" | "expired" }[]
  product?: { id: string; title: string } | null
}
