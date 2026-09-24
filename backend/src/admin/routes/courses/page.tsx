import { defineRouteConfig } from "@medusajs/admin-sdk"
import { AcademicCap, Trash } from "@medusajs/icons"
import {
  Badge,
  Container,
  Heading,
  IconButton,
  Table,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { Link, useNavigate } from "react-router-dom"
import { CreateCourseModal } from "../../components/create-course-modal"
import { levelColor } from "../../lib/constants"
import { useCourses, useDeleteCourse } from "../../lib/queries"
import type { AdminCourse } from "../../types"

const CoursesPage = () => {
  const { data, isLoading, isError, error } = useCourses()
  const deleteCourse = useDeleteCourse()
  const prompt = usePrompt()
  const navigate = useNavigate()
  const courses = data?.courses ?? []

  const confirmDelete = async (course: AdminCourse) => {
    const confirmed = await prompt({
      title: "Delete course?",
      description: `"${course.title}" will be removed from the catalog. Existing enrollments are kept.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (!confirmed) return
    deleteCourse.mutate(course.id, {
      onSuccess: () => toast.success(`Deleted "${course.title}"`),
      onError: (e) => toast.error(e.message),
    })
  }

  const learners = courses.reduce((n, c) => n + (c.enrollments?.length ?? 0), 0)
  const certified = courses.reduce(
    (n, c) => n + (c.enrollments?.filter((e) => e.status === "completed").length ?? 0),
    0
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Courses</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {courses.length} courses · {learners} enrollments · {certified} certificates issued
          </Text>
        </div>
        <CreateCourseModal />
      </div>

      {isError && (
        <Text className="px-6 py-4 text-ui-fg-error">Could not load courses: {error.message}</Text>
      )}

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Title</Table.HeaderCell>
            <Table.HeaderCell>Level</Table.HeaderCell>
            <Table.HeaderCell>Lessons</Table.HeaderCell>
            <Table.HeaderCell>Learners</Table.HeaderCell>
            <Table.HeaderCell>Product</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && (
            <Table.Row>
              <Table.Cell>Loading…</Table.Cell>
            </Table.Row>
          )}
          {!isLoading && !courses.length && (
            <Table.Row>
              <Table.Cell>No courses yet. Use "Create course" to add the first one.</Table.Cell>
            </Table.Row>
          )}
          {courses.map((course) => (
            <Table.Row
              key={course.id}
              className="cursor-pointer"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <Table.Cell className="font-medium">{course.title}</Table.Cell>
              <Table.Cell>
                <Badge size="2xsmall" color={levelColor[course.level]}>
                  {course.level}
                </Badge>
              </Table.Cell>
              <Table.Cell>{course.lessons?.length ?? 0}</Table.Cell>
              <Table.Cell>{course.enrollments?.length ?? 0}</Table.Cell>
              <Table.Cell onClick={(e) => e.stopPropagation()}>
                {course.product ? (
                  <Link to={`/products/${course.product.id}`} className="text-ui-fg-interactive">
                    {course.product.title}
                  </Link>
                ) : (
                  "—"
                )}
              </Table.Cell>
              <Table.Cell>
                <Badge size="2xsmall" color={course.is_published ? "green" : "grey"}>
                  {course.is_published ? "Published" : "Draft"}
                </Badge>
              </Table.Cell>
              <Table.Cell className="text-right" onClick={(e) => e.stopPropagation()}>
                <IconButton
                  size="small"
                  variant="transparent"
                  aria-label={`Delete ${course.title}`}
                  onClick={() => confirmDelete(course)}
                >
                  <Trash />
                </IconButton>
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
