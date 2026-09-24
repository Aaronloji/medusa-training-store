import { Input, Label, Select, Switch, Textarea } from "@medusajs/ui"
import type { CourseFormValues, Level } from "../types"

export const LEVELS: Level[] = ["beginner", "intermediate", "advanced"]

/** Shared fields for the create and edit course forms. */
export function CourseFields({
  values,
  onChange,
}: {
  values: CourseFormValues
  onChange: (values: CourseFormValues) => void
}) {
  const set = <K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) =>
    onChange({ ...values, [key]: value })

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-2">
        <Label htmlFor="course-title">Title</Label>
        <Input
          id="course-title"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-y-2">
        <Label htmlFor="course-description">Description</Label>
        <Textarea
          id="course-description"
          value={values.description ?? ""}
          onChange={(e) => set("description", e.target.value || null)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-2">
          <Label>Level</Label>
          <Select value={values.level} onValueChange={(v) => set("level", v as Level)}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {LEVELS.map((level) => (
                <Select.Item key={level} value={level}>
                  <span className="capitalize">{level}</span>
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="course-validity">Certificate validity (days)</Label>
          <Input
            id="course-validity"
            type="number"
            min={1}
            placeholder="Never expires"
            value={values.certificate_validity_days ?? ""}
            onChange={(e) =>
              set("certificate_validity_days", e.target.value ? Number(e.target.value) : null)
            }
          />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <Label htmlFor="course-published">Published</Label>
          <p className="txt-small text-ui-fg-subtle">Visible in the storefront catalog.</p>
        </div>
        <Switch
          id="course-published"
          checked={values.is_published}
          onCheckedChange={(checked) => set("is_published", checked)}
        />
      </div>
    </div>
  )
}
