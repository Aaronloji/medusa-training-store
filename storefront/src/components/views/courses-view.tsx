"use client"

import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import { CourseCard, CourseCardSkeleton } from "@/components/course-card"
import { Container } from "@/components/ui"
import { useCourses } from "@/lib/hooks"
import type { Course, Level } from "@/lib/types"

const FILTERS: { value: Level | undefined; label: string }[] = [
  { value: undefined, label: "All levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
]

export function CoursesView({ initialCourses }: { initialCourses: Course[] | null }) {
  const [level, setLevel] = useState<Level | undefined>()
  const [search, setSearch] = useState("")
  // Server-rendered data covers the unfiltered list; filters fetch on the client.
  const { data: courses, loading, error } = useCourses(level, level ? undefined : initialCourses)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!courses || !term) return courses
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term)
    )
  }, [courses, search])

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">All courses</h1>
        <p className="mt-2 text-muted">
          Online, self-paced and certificate-backed. Filtering runs on the Medusa API.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setLevel(f.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                level === f.value
                  ? "bg-ink text-white"
                  : "border border-line bg-white text-ink-soft hover:border-ink/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses"
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </label>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Could not load courses: {error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading || !filtered
          ? Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)
          : filtered.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>

      {!loading && filtered?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center">
          <p className="font-semibold">No courses match your filters</p>
          <p className="mt-1 text-sm text-muted">Try another level or search term.</p>
        </div>
      )}
    </Container>
  )
}
