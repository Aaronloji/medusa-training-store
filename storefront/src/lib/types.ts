export type Level = "beginner" | "intermediate" | "advanced"

export type Lesson = {
  id: string
  title: string
  position: number
  duration_minutes: number
  content_url?: string | null
}

export type Course = {
  id: string
  handle: string
  title: string
  description: string | null
  level: Level
  certificate_validity_days: number | null
  lessons: Lesson[]
  product: {
    id: string
    handle: string
    thumbnail: string | null
    variants: {
      id: string
      calculated_price?: {
        calculated_amount: number
        currency_code: string
      } | null
    }[]
  } | null
}

export type EnrollmentStatus = "active" | "completed" | "expired"

export type Enrollment = {
  id: string
  status: EnrollmentStatus
  progress_percent: number
  completed_lesson_ids: string[] | null
  completed_at: string | null
  expires_at: string | null
  certificate_code: string | null
  created_at: string
  course: {
    id: string
    handle: string
    title: string
    description: string | null
    level: Level
    certificate_validity_days: number | null
    product: { thumbnail: string | null } | null
    lessons: Lesson[]
  }
}

export type CertificateVerification = {
  code: string
  holder: string
  course: string
  issued_at: string
  expires_at: string | null
  valid: boolean
}
