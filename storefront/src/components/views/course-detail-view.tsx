"use client"

import { ArrowLeft, Award, BookOpen, CheckCircle2, Clock, Lock, ShieldCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Container, LevelBadge, Skeleton } from "@/components/ui"
import {
  coursePrice,
  formatDuration,
  formatValidity,
  sortLessons,
  totalMinutes,
} from "@/lib/format"
import { useCourse, useEnrollments } from "@/lib/hooks"
import type { Course } from "@/lib/types"
import { useStore } from "@/providers/store-provider"

export function CourseDetailView({
  handle,
  initialCourse,
}: {
  handle: string
  initialCourse: Course | null
}) {
  const { data: course, loading, error } = useCourse(handle, initialCourse)
  const { customer } = useStore()
  const { data: enrollments } = useEnrollments()

  if (error) {
    return (
      <Container className="py-24 text-center">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <Link href="/courses" className="mt-4 inline-block font-semibold text-brand-600">
          ← Back to courses
        </Link>
      </Container>
    )
  }

  if (loading || !course) {
    return (
      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="aspect-[16/8] w-full" />
        </div>
        <Skeleton className="h-80" />
      </Container>
    )
  }

  const lessons = sortLessons(course.lessons)
  const price = coursePrice(course)
  const enrollment = enrollments?.find(
    (e) => e.course.id === course.id && e.status !== "expired"
  )
  const checkoutHref = `/checkout?course=${course.handle}`
  const enrollHref = customer ? checkoutHref : `/login?next=${encodeURIComponent(checkoutHref)}`

  return (
    <>
      <section className="border-b border-line bg-white">
        <Container className="py-10">
          <Link
            href="/courses"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
          >
            <ArrowLeft className="size-4" /> All courses
          </Link>
          <div className="max-w-3xl">
            <LevelBadge level={course.level} />
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {course.title}
            </h1>
            <p className="mt-4 text-lg text-ink-soft">{course.description}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink-soft">
              <span className="flex items-center gap-2">
                <BookOpen className="size-4 text-brand-600" /> {lessons.length} lessons
              </span>
              <span className="flex items-center gap-2">
                <Clock className="size-4 text-brand-600" />{" "}
                {formatDuration(totalMinutes(lessons))} total
              </span>
              <span className="flex items-center gap-2">
                <Award className="size-4 text-brand-600" />{" "}
                {formatValidity(course.certificate_validity_days)}
              </span>
            </div>

            {/* Compact call to action for screens where the sidebar sits far below */}
            <div className="mt-8 flex items-center gap-4 lg:hidden">
              {enrollment ? (
                <Link
                  href={`/learning/${enrollment.id}`}
                  className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
                >
                  Continue learning
                </Link>
              ) : (
                <>
                  <span className="text-3xl font-extrabold tracking-tight">{price ?? "—"}</span>
                  <Link
                    href={enrollHref}
                    className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
                  >
                    Enroll now
                  </Link>
                </>
              )}
            </div>
          </div>
        </Container>
      </section>

      <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {course.product?.thumbnail && (
            <div className="relative aspect-[16/8] overflow-hidden rounded-2xl">
              <Image
                src={course.product.thumbnail}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 700px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold">Curriculum</h2>
            <ol className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
              {lessons.map((lesson, i) => (
                <li key={lesson.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-canvas text-sm font-bold text-ink-soft">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium">{lesson.title}</span>
                  <span className="text-sm text-muted">
                    {formatDuration(lesson.duration_minutes)}
                  </span>
                  {!enrollment && <Lock className="size-4 text-muted" aria-label="Locked" />}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Purchase card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
            {enrollment ? (
              <>
                <p className="flex items-center gap-2 font-semibold text-brand-700">
                  <CheckCircle2 className="size-5" /> You&apos;re enrolled
                </p>
                <p className="mt-2 text-sm text-muted">
                  {enrollment.status === "completed"
                    ? "You completed this course. Your certificate is ready."
                    : `${enrollment.progress_percent}% complete. Keep going!`}
                </p>
                <Link
                  href={
                    enrollment.status === "completed"
                      ? `/certificate/${enrollment.id}`
                      : `/learning/${enrollment.id}`
                  }
                  className="mt-5 block rounded-xl bg-brand-600 py-3 text-center font-semibold text-white transition hover:bg-brand-700"
                >
                  {enrollment.status === "completed" ? "View certificate" : "Continue learning"}
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted">One-time purchase</p>
                <p className="mt-1 text-4xl font-extrabold tracking-tight">{price ?? "—"}</p>
                <Link
                  href={enrollHref}
                  className="mt-6 block rounded-xl bg-brand-600 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-brand-700"
                >
                  Enroll now
                </Link>
                <ul className="mt-6 space-y-3 text-sm text-ink-soft">
                  {[
                    "Instant access after checkout",
                    `${lessons.length} self-paced lessons`,
                    "Verifiable certificate of completion",
                    formatValidity(course.certificate_validity_days),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-6 flex items-center gap-2 border-t border-line pt-4 text-xs text-muted">
              <ShieldCheck className="size-4" /> Demo store: test payments only, no card charged.
            </p>
          </div>
        </aside>
      </Container>
    </>
  )
}
