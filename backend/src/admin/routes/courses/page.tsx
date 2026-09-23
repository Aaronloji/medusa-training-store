import { defineRouteConfig } from "@medusajs/admin-sdk"
import { AcademicCap } from "@medusajs/icons"
import { Badge, Container, Heading, Table, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import type { AdminCourse } from "../../types"

const levelColor = {
  beginner: "green",
  intermediate: "orange",
  advanced: "red",
} as const

const CoursesPage = () => {
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/admin/courses", { credentials: "include" })
      .then((res) => res.json())
      .then(({ courses }) => setCourses(courses))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Courses</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Training courses sold through the catalog
          </Text>
        </div>
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Title</Table.HeaderCell>
            <Table.HeaderCell>Level</Table.HeaderCell>
            <Table.HeaderCell>Lessons</Table.HeaderCell>
            <Table.HeaderCell>Learners</Table.HeaderCell>
            <Table.HeaderCell>Product</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {loading && (
            <Table.Row>
              <Table.Cell>Loading…</Table.Cell>
            </Table.Row>
          )}
          {!loading && !courses.length && (
            <Table.Row>
              <Table.Cell>No courses yet. Create one with POST /admin/courses.</Table.Cell>
            </Table.Row>
          )}
          {courses.map((course) => (
            <Table.Row key={course.id}>
              <Table.Cell>{course.title}</Table.Cell>
              <Table.Cell>
                <Badge color={levelColor[course.level]}>{course.level}</Badge>
              </Table.Cell>
              <Table.Cell>{course.lessons?.length ?? 0}</Table.Cell>
              <Table.Cell>{course.enrollments?.length ?? 0}</Table.Cell>
              <Table.Cell>
                {course.product ? (
                  <Link to={`/products/${course.product.id}`}>{course.product.title}</Link>
                ) : (
                  "—"
                )}
              </Table.Cell>
              <Table.Cell>
                <Badge color={course.is_published ? "green" : "grey"}>
                  {course.is_published ? "Published" : "Draft"}
                </Badge>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Courses",
  icon: AcademicCap,
})

export default CoursesPage
