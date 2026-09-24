import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { useProductCourse } from "../lib/queries"

// Shows the course linked to a product on the product details page.
const ProductCourseWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const { data, isLoading } = useProductCourse(product.id)
  const course = data?.course

  const activeLearners = course?.enrollments?.filter((e) => e.status === "active").length ?? 0
  const certified = course?.enrollments?.filter((e) => e.status === "completed").length ?? 0

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Training course</Heading>
        {course && (
          <Badge size="2xsmall" color={course.is_published ? "green" : "grey"}>
            {course.is_published ? "Published" : "Draft"}
          </Badge>
        )}
      </div>
      <div className="px-6 py-4">
        {isLoading ? (
          <Text size="small">Loading…</Text>
        ) : !course ? (
          <Text size="small" className="text-ui-fg-subtle">
            This product is not linked to a course.
          </Text>
        ) : (
          <div className="flex flex-col gap-y-2">
            <Text weight="plus">{course.title}</Text>
            <Text size="small" className="text-ui-fg-subtle">
              {course.lessons?.length ?? 0} lessons · {activeLearners} learning · {certified}{" "}
              certified
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              Certificate validity:{" "}
              {course.certificate_validity_days
                ? `${course.certificate_validity_days} days`
                : "does not expire"}
            </Text>
            <Link to={`/courses/${course.id}`} className="txt-small text-ui-fg-interactive">
              Manage course →
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
