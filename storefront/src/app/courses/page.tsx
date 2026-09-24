import type { Metadata } from "next"
import { CoursesView } from "@/components/views/courses-view"
import { getCoursesServer } from "@/lib/server-api"

export const revalidate = 300

export const metadata: Metadata = {
  title: "All courses",
  description:
    "Online OSHA, HIPAA, food safety and workplace compliance courses with verifiable certificates.",
}

export default async function CoursesPage() {
  const courses = await getCoursesServer()
  return <CoursesView initialCourses={courses} />
}
