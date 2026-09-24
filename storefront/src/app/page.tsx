import { HomeView } from "@/components/views/home-view"
import { getCoursesServer } from "@/lib/server-api"

// Rendered per request so a build-time outage of the demo API never gets baked
// into the page; the catalog data itself is cached for 5 minutes (Data Cache).
export const dynamic = "force-dynamic"

export default async function HomePage() {
  const courses = await getCoursesServer()
  return <HomeView initialCourses={courses} />
}
