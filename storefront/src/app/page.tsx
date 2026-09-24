import { HomeView } from "@/components/views/home-view"
import { getCoursesServer } from "@/lib/server-api"

// Server-rendered with cached catalog data (ISR); refreshed every 5 minutes.
export const revalidate = 300

export default async function HomePage() {
  const courses = await getCoursesServer()
  return <HomeView initialCourses={courses} />
}
