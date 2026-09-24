import type { Metadata } from "next"
import { CoursesView } from "@/components/views/courses-view"
import { getCoursesServer } from "@/lib/server-api"

// See app/page.tsx: per-request render, 5-minute data cache.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "All courses",
  description:
    "Online OSHA, HIPAA, food safety and workplace compliance courses with verifiable certificates.",
}

export default async function CoursesPage() {
  const courses = await getCoursesServer()
  return <CoursesView initialCourses={courses} />
}
