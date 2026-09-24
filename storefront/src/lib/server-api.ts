import type { Course } from "./types"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")

/** Server-side responses are cached and refreshed in the background (ISR). */
export const REVALIDATE_SECONDS = 300

/**
 * Server-side Store API call. The demo backend may be asleep on free hosting,
 * so give up quickly and let the page fall back to client-side fetching.
 */
async function storeFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function getCoursesServer() {
  const data = await storeFetch<{ courses: Course[] }>("/store/courses?limit=50")
  return data?.courses ?? null
}

export async function getCourseServer(handle: string) {
  const data = await storeFetch<{ course: Course }>(`/store/courses/${encodeURIComponent(handle)}`)
  return data?.course ?? null
}
