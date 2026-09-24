import type { Metadata } from "next"
import { CourseDetailView } from "@/components/views/course-detail-view"
import { getCourseServer, SITE_URL } from "@/lib/server-api"

// Per-request render with a 5-minute data cache (see app/page.tsx), so a page
// first visited while the demo API sleeps is never cached without its course.
export const dynamic = "force-dynamic"

type Props = { params: Promise<{ handle: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const course = await getCourseServer(handle)
  if (!course) {
    return { title: "Course" }
  }
  return {
    title: course.title,
    description: course.description ?? undefined,
    alternates: { canonical: `/courses/${course.handle}` },
    openGraph: {
      title: course.title,
      description: course.description ?? undefined,
      images: course.product?.thumbnail ? [course.product.thumbnail] : undefined,
    },
  }
}

export default async function CoursePage({ params }: Props) {
  const { handle } = await params
  const course = await getCourseServer(handle)
  const price = course?.product?.variants?.[0]?.calculated_price

  // schema.org Course data helps search engines show rich results.
  const jsonLd = course && {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    url: `${SITE_URL}/courses/${course.handle}`,
    provider: { "@type": "Organization", name: "CertPath", sameAs: SITE_URL },
    ...(price && {
      offers: {
        "@type": "Offer",
        price: price.calculated_amount,
        priceCurrency: price.currency_code.toUpperCase(),
        category: "Paid",
      },
    }),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: `PT${course.lessons.reduce((m, l) => m + l.duration_minutes, 0)}M`,
    },
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <CourseDetailView handle={handle} initialCourse={course} />
    </>
  )
}
