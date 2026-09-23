import type { Course, Lesson } from "./types"

export function formatPrice(amount: number, currencyCode = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatValidity(days: number | null) {
  if (!days) return "Never expires"
  if (days % 365 === 0) {
    const years = days / 365
    return `Valid ${years} year${years > 1 ? "s" : ""}`
  }
  return `Valid ${days} days`
}

export function totalMinutes(lessons: Pick<Lesson, "duration_minutes">[] = []) {
  return lessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0)
}

export function sortLessons<T extends Pick<Lesson, "position">>(lessons: T[] = []) {
  return [...lessons].sort((a, b) => a.position - b.position)
}

export function coursePrice(course: Course) {
  const price = course.product?.variants?.[0]?.calculated_price
  return price ? formatPrice(price.calculated_amount, price.currency_code) : null
}
