import type { MetadataRoute } from "next"
import { getCoursesServer, SITE_URL } from "@/lib/server-api"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = (await getCoursesServer()) ?? []
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/courses`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/verify`, changeFrequency: "yearly", priority: 0.3 },
    ...courses.map((course) => ({
      url: `${SITE_URL}/courses/${course.handle}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]
}
