"use client"

import { Award, BookOpen, CalendarClock, GraduationCap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { RequireAuth } from "@/components/require-auth"
import { Container, ProgressBar, Skeleton, StatusBadge } from "@/components/ui"
import { formatDate } from "@/lib/format"
import { useEnrollments } from "@/lib/hooks"
import type { Enrollment } from "@/lib/types"
import { useStore } from "@/providers/store-provider"

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Award }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5">
      <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-2xl font-extrabold">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  )
}

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const { course, status } = enrollment
  const href = status === "completed" ? `/certificate/${enrollment.id}` : `/learning/${enrollment.id}`
  const cta =
    status === "completed"
      ? "View certificate"
      : status === "expired"
        ? "Renew certification"
        : enrollment.progress_percent > 0
          ? "Continue"
          : "Start course"

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-5 shadow-card sm:flex-row sm:items-center">
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl bg-brand-50 sm:w-44">
        {course.product?.thumbnail && (
          <Image src={course.product.thumbnail} alt="" fill sizes="176px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {enrollment.expires_at && status !== "active" && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <CalendarClock className="size-3.5" />
              {status === "expired" ? "Expired" : "Valid until"} {formatDate(enrollment.expires_at)}
            </span>
          )}
        </div>
        <h3 className="mt-2 truncate text-lg font-bold">{course.title}</h3>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={enrollment.progress_percent} />
          <span className="w-10 shrink-0 text-right text-sm font-semibold">
            {enrollment.progress_percent}%
          </span>
        </div>
      </div>
      <Link
        href={status === "expired" ? `/courses/${course.handle}` : href}
        className={`shrink-0 rounded-xl px-5 py-2.5 text-center text-sm font-semibold transition ${
          status === "completed"
            ? "bg-gold-100 text-gold-700 hover:bg-gold-100/70"
            : "bg-brand-600 text-white hover:bg-brand-700"
        }`}
      >
        {cta}
      </Link>
    </div>
  )
}

function LearningDashboard() {
  const { customer } = useStore()
  const { data: enrollments, loading } = useEnrollments()

  const active = enrollments?.filter((e) => e.status === "active").length ?? 0
  const certified = enrollments?.filter((e) => e.status === "completed").length ?? 0

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">
        Hi {customer?.first_name ?? "there"} 👋
      </h1>
      <p className="mt-2 text-muted">Here&apos;s your training at a glance.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Courses" value={enrollments?.length ?? 0} icon={BookOpen} />
        <Stat label="In progress" value={active} icon={GraduationCap} />
        <Stat label="Certificates" value={certified} icon={Award} />
      </div>

      <h2 className="mt-12 text-xl font-bold">My courses</h2>
      <div className="mt-4 space-y-4">
        {loading &&
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32" />)}

        {!loading && enrollments?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
            <GraduationCap className="mx-auto size-10 text-brand-600" />
            <p className="mt-4 font-semibold">You haven&apos;t enrolled in any course yet</p>
            <p className="mt-1 text-sm text-muted">
              Pick a course, check out with the test payment, and it will show up here.
            </p>
            <Link
              href="/courses"
              className="mt-6 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Browse courses
            </Link>
          </div>
        )}

        {enrollments?.map((e) => <EnrollmentCard key={e.id} enrollment={e} />)}
      </div>
    </Container>
  )
}

export default function LearningPage() {
  return (
    <RequireAuth>
      <LearningDashboard />
    </RequireAuth>
  )
}
