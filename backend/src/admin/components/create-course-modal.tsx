import { Plus, Trash } from "@medusajs/icons"
import {
  Button,
  FocusModal,
  Heading,
  IconButton,
  Input,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import { useCreateCourse, useProductOptions } from "../lib/queries"
import type { CourseFormValues } from "../types"
import { CourseFields } from "./course-form"

const EMPTY: CourseFormValues = {
  title: "",
  description: null,
  level: "beginner",
  certificate_validity_days: 365,
  is_published: false,
}

const NO_PRODUCT = "none"

const toHandle = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export function CreateCourseModal() {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<CourseFormValues>(EMPTY)
  const [productId, setProductId] = useState(NO_PRODUCT)
  const [lessons, setLessons] = useState([{ title: "", duration_minutes: 30 }])
  const { data: products } = useProductOptions()
  const createCourse = useCreateCourse()

  const reset = () => {
    setValues(EMPTY)
    setProductId(NO_PRODUCT)
    setLessons([{ title: "", duration_minutes: 30 }])
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    createCourse.mutate(
      {
        ...values,
        handle: toHandle(values.title),
        product_id: productId === NO_PRODUCT ? undefined : productId,
        lessons: lessons.filter((l) => l.title.trim()),
      },
      {
        onSuccess: ({ course }) => {
          toast.success(`Created "${course.title}"`)
          setOpen(false)
          reset()
        },
        onError: (error) => toast.error(error.message),
      }
    )
  }

  const updateLesson = (index: number, patch: Partial<(typeof lessons)[number]>) =>
    setLessons((all) => all.map((l, i) => (i === index ? { ...l, ...patch } : l)))

  return (
    <FocusModal open={open} onOpenChange={setOpen}>
      <FocusModal.Trigger asChild>
        <Button size="small" variant="secondary">
          Create course
        </Button>
      </FocusModal.Trigger>
      <FocusModal.Content>
        <form onSubmit={submit} className="flex h-full flex-col overflow-hidden">
          <FocusModal.Header>
            <div className="flex items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button size="small" variant="secondary" type="button">
                  Cancel
                </Button>
              </FocusModal.Close>
              <Button size="small" type="submit" isLoading={createCourse.isPending}>
                Save
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-1 justify-center overflow-y-auto px-6 py-16">
            <div className="flex w-full max-w-[640px] flex-col gap-y-8">
              <div>
                <Heading>Create course</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  Runs the create-course workflow: course, lessons and (optionally) the product link.
                </Text>
              </div>

              <CourseFields values={values} onChange={setValues} />

              <div className="flex flex-col gap-y-2">
                <Label>Sold as product</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value={NO_PRODUCT}>Not linked yet</Select.Item>
                    {products?.products.map((p) => (
                      <Select.Item key={p.id} value={p.id}>
                        {p.title}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              <div className="flex flex-col gap-y-3">
                <div className="flex items-center justify-between">
                  <Label>Lessons</Label>
                  <Button
                    size="small"
                    variant="transparent"
                    type="button"
                    onClick={() => setLessons((all) => [...all, { title: "", duration_minutes: 30 }])}
                  >
                    <Plus /> Add lesson
                  </Button>
                </div>
                {lessons.map((lesson, i) => (
                  <div key={i} className="flex items-center gap-x-2">
                    <Text size="small" className="w-6 text-ui-fg-muted">
                      {i + 1}.
                    </Text>
                    <Input
                      placeholder="Lesson title"
                      value={lesson.title}
                      onChange={(e) => updateLesson(i, { title: e.target.value })}
                    />
                    <Input
                      className="w-28"
                      type="number"
                      min={0}
                      aria-label="Duration in minutes"
                      value={lesson.duration_minutes}
                      onChange={(e) => updateLesson(i, { duration_minutes: Number(e.target.value) })}
                    />
                    <IconButton
                      type="button"
                      variant="transparent"
                      aria-label="Remove lesson"
                      disabled={lessons.length === 1}
                      onClick={() => setLessons((all) => all.filter((_, j) => j !== i))}
                    >
                      <Trash />
                    </IconButton>
                  </div>
                ))}
              </div>
            </div>
          </FocusModal.Body>
        </form>
      </FocusModal.Content>
    </FocusModal>
  )
}
