const DAY_MS = 24 * 60 * 60 * 1000

export type ProgressResult = {
  completed_lesson_ids: string[]
  progress_percent: number
  is_complete: boolean
}

/**
 * Adds a lesson to the list of completed lessons and recalculates progress.
 * Idempotent: completing the same lesson twice does not change the result.
 */
export function applyLessonCompletion(
  completedLessonIds: string[] | null | undefined,
  lessonId: string,
  courseLessonIds: string[]
): ProgressResult {
  if (!courseLessonIds.includes(lessonId)) {
    throw new Error(`Lesson ${lessonId} does not belong to this course`)
  }

  const completed = new Set(completedLessonIds ?? [])
  completed.add(lessonId)

  // Only count lessons that still exist in the course.
  const valid = courseLessonIds.filter((id) => completed.has(id))
  const total = courseLessonIds.length
  const progress_percent = total === 0 ? 0 : Math.floor((valid.length / total) * 100)

  return {
    completed_lesson_ids: valid,
    progress_percent,
    is_complete: total > 0 && valid.length === total,
  }
}

export function computeCertificateExpiry(
  completedAt: Date,
  validityDays: number | null | undefined
): Date | null {
  if (validityDays === null || validityDays === undefined || validityDays <= 0) {
    return null
  }
  return new Date(completedAt.getTime() + validityDays * DAY_MS)
}

/**
 * Human-friendly, verifiable certificate code, e.g. "CERT-20260923-7F3A9C".
 */
export function generateCertificateCode(enrollmentId: string, completedAt: Date): string {
  const date = completedAt.toISOString().slice(0, 10).replace(/-/g, "")
  let hash = 0
  for (const char of `${enrollmentId}:${completedAt.getTime()}`) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  const suffix = hash.toString(16).toUpperCase().padStart(8, "0").slice(0, 6)
  return `CERT-${date}-${suffix}`
}
