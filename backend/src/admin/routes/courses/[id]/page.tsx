import { ArrowUturnLeft } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  StatusBadge,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { CourseFields } from "../../../components/course-form"
import { useCourse, useUpdateCourse } from "../../../lib/queries"
import type { AdminCourse, CourseFormValues } from "../../../types"
import { levelColor } from "../../../lib/constants"

const toFormValues = (course: AdminCourse): CourseFormValues => ({
  title: course.title,
  description: course.description,
  level: course.level,
  certificate_validity_days: course.certificate_validity_days,
  is_published: course.is_published,
})

const STATUS_COLOR = { active: "blue", completed: "green", expired: "red" } as const

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useCourse(id!)
  const updateCourse = useUpdateCourse(id!)
  const course = data?.course
  const [values, setValues] = useState<CourseFormValues | null>(null)

  // Seed the form once the course arrives (and after each save).
  useEffect(() => {
    if (course) setValues(toFormValues(course))
  }, [course])

  if (isLoading || !course || !values) {
    return (
      <Container>
        <Text>Loading…</Text>
      </Container>
    )
  }

  const dirty = JSON.stringify(values) !== JSON.stringify(toFormValues(course))
  const lessons = [...(course.lessons ?? [])].sort((a, b) => a.position - b.position)
  const enrollments = course.enrollments ?? []

  const save = () =>
    updateCourse.mutate(values, {
      onSuccess: () => toast.success("Course updated"),
      onError: (e) => toast.error(e.message),
    })

  return (
    <div className="flex flex-col gap-y-3">
      <Link to="/courses" className="txt-small flex items-center gap-x-1 text-ui-fg-subtle">
        <ArrowUturnLeft /> Courses
      </Link>

      <div className="grid gap-3 xl:grid-cols-[1fr_400px]">
        <Container className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-x-2">
              <Heading>{course.title}</Heading>
              <Badge size="2xsmall" color={levelColor[course.level]}>
                {course.level}
              </Badge>
            </div>
            <Button size="small" disabled={!dirty} isLoading={updateCourse.isPending} onClick={save}>
              Save changes
            </Button>
          </div>
          <div className="px-6 py-4">
            <CourseFields values={values} onChange={setValues} />
          </div>
        </Container>

        <div className="flex flex-col gap-y-3">
          <Container className="divide-y p-0">
            <div className="px-6 py-4">
              <Heading level="h2">Lessons</Heading>
            </div>
            {lessons.map((lesson) => (
              <div key={lesson.id} className="flex items-center justify-between px-6 py-3">
                <Text size="small">
                  {lesson.position}. {lesson.title}
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {lesson.duration_minutes} min
                </Text>
              </div>
            ))}
          </Container>
          <Container className="px-6 py-4">
            <Heading level="h2">Product</Heading>
            <Text size="small" className="mt-2 text-ui-fg-subtle">
              {course.product ? (
                <Link to={`/products/${course.product.id}`} className="text-ui-fg-interactive">
                  {course.product.title}
                </Link>
              ) : (
                "Not linked to a product"
              )}
            </Text>
          </Container>
        </div>
      </div>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Learners ({enrollments.length})</Heading>
        </div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Learner</Table.HeaderCell>
              <Table.HeaderCell>Progress</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Enrolled</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {!enrollments.length && (
              <Table.Row>
                <Table.Cell>No learners yet.</Table.Cell>
              </Table.Row>
            )}
            {enrollments.map((e) => (
              <Table.Row key={e.id}>
                <Table.Cell>
                  {[e.customer?.first_name, e.customer?.last_name].filter(Boolean).join(" ") ||
                    e.customer?.email ||
                    "—"}
                </Table.Cell>
                <Table.Cell>{e.progress_percent}%</Table.Cell>
                <Table.Cell>
                  <StatusBadge color={STATUS_COLOR[e.status]}>{e.status}</StatusBadge>
                </Table.Cell>
                <Table.Cell>{new Date(e.created_at).toLocaleDateString()}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>
    </div>
  )
}

export default CourseDetailPage
