import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import type { AdminCourse } from "../types"

// Shows the course linked to a product on the product details page.
const ProductCourseWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const [course, setCourse] = useState<AdminCourse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/admin/products/${product.id}/course`, { credentials: "include" })
      .then((res) => res.json())
      .then(({ course }) => setCourse(course))
      .finally(() => setLoading(false))
  }, [product.id])

  const activeLearners =
    course?.enrollments?.filter((e) => e.status === "active").length ?? 0

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Training course</Heading>
        {course && (
          <Badge color={course.is_published ? "green" : "grey"}>
            {course.is_published ? "Published" : "Draft"}
          </Badge>
        )}
      </div>
      <div className="px-6 py-4">
        {loading ? (
          <Text size="small">Loading…</Text>
        ) : !course ? (
          <Text size="small" className="text-ui-fg-subtle">
            This product is not linked to a course.
          </Text>
        ) : (
          <div className="flex flex-col gap-y-2">
            <Text weight="plus">{course.title}</Text>
            <Text size="small" className="text-ui-fg-subtle">
              {course.lessons?.length ?? 0} lessons · level {course.level} · {activeLearners}{" "}
              active learner(s)
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              Certificate validity:{" "}
              {course.certificate_validity_days
                ? `${course.certificate_validity_days} days`
                : "does not expire"}
            </Text>
            <Link to="/courses" className="text-ui-fg-interactive txt-small">
              View all courses →
            </Link>
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductCourseWidget
