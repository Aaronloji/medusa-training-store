import {
  applyLessonCompletion,
  computeCertificateExpiry,
  generateCertificateCode,
} from "../progress"

describe("applyLessonCompletion", () => {
  const lessons = ["l1", "l2", "l3", "l4"]

  it("calculates partial progress", () => {
    const result = applyLessonCompletion(["l1"], "l2", lessons)
    expect(result.progress_percent).toBe(50)
    expect(result.is_complete).toBe(false)
  })

  it("is idempotent", () => {
    const result = applyLessonCompletion(["l1", "l2"], "l2", lessons)
    expect(result.completed_lesson_ids).toEqual(["l1", "l2"])
    expect(result.progress_percent).toBe(50)
  })

  it("marks the course as complete when every lesson is done", () => {
    const result = applyLessonCompletion(["l1", "l2", "l3"], "l4", lessons)
    expect(result.progress_percent).toBe(100)
    expect(result.is_complete).toBe(true)
  })

  it("ignores lessons that were removed from the course", () => {
    const result = applyLessonCompletion(["old-lesson", "l1"], "l2", lessons)
    expect(result.completed_lesson_ids).toEqual(["l1", "l2"])
  })

  it("rejects lessons from another course", () => {
    expect(() => applyLessonCompletion([], "other", lessons)).toThrow()
  })
})

describe("computeCertificateExpiry", () => {
  const completedAt = new Date("2026-01-01T00:00:00.000Z")

  it("adds the validity period", () => {
    expect(computeCertificateExpiry(completedAt, 365)?.toISOString()).toBe(
      "2027-01-01T00:00:00.000Z"
    )
  })

  it("returns null for certificates that never expire", () => {
    expect(computeCertificateExpiry(completedAt, null)).toBeNull()
    expect(computeCertificateExpiry(completedAt, 0)).toBeNull()
  })
})

describe("generateCertificateCode", () => {
  it("is deterministic and well formatted", () => {
    const date = new Date("2026-09-23T10:00:00.000Z")
    const code = generateCertificateCode("enrl_123", date)
    expect(code).toMatch(/^CERT-20260923-[0-9A-F]{6}$/)
    expect(generateCertificateCode("enrl_123", date)).toBe(code)
  })
})
