"use client"

import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  PartyPopper,
  PlayCircle,
} from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { Suspense, useMemo, useState } from "react"
import { RequireAuth } from "@/components/require-auth"
import { Container, ProgressBar, Skeleton, Spinner } from "@/components/ui"
import { completeLesson } from "@/lib/api"
import { formatDuration, sortLessons } from "@/lib/format"
import { useEnrollments } from "@/lib/hooks"
import type { Enrollment } from "@/lib/types"

const LESSON_POINTS = [
  "Why this topic matters on the job and what regulators expect",
  "Key terms and definitions you will be tested on",
  "Real-world scenarios and how to respond correctly",
  "A short knowledge check to reinforce what you learned",
]

function Player() {
  const { id } = useParams<{ id: string }>()
  const welcome = useSearchParams().get("welcome") === "1"
  const { data: enrollments, loading, setData } = useEnrollments()
  const enrollment = enrollments?.find((e) => e.id === id)

  const lessons = useMemo(() => sortLessons(enrollment?.course.lessons), [enrollment])
  const completed = useMemo(
    () => new Set(enrollment?.completed_lesson_ids ?? []),
    [enrollment]
  )

  const [selectedId, setCurrentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justCertified, setJustCertified] = useState(false)
  const [showWelcome, setShowWelcome] = useState(welcome)

  // Until the learner picks a lesson, start on the first one that isn't done yet.
  const currentId =
    selectedId ?? (lessons.find((l) => !completed.has(l.id)) ?? lessons[0])?.id ?? null

  if (loading) {
    return (
      <Container className="grid gap-6 py-10 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </Container>
    )
  }

  if (!enrollment) {
    return (
      <Container className="py-24 text-center">
        <p className="font-semibold">Course not found in your learning.</p>
        <Link href="/learning" className="mt-3 inline-block font-semibold text-brand-600">
          ← My learning
        </Link>
      </Container>
    )
  }

  const currentIndex = lessons.findIndex((l) => l.id === currentId)
  const current = lessons[currentIndex]
  const isDone = current ? completed.has(current.id) : false
  const nextLesson = lessons[currentIndex + 1]

  const markComplete = async () => {
    if (!current) return
    setSaving(true)
    setError(null)
    try {
      const updated = await completeLesson(enrollment.id, current.id)
      const merged: Enrollment = { ...enrollment, ...updated, course: enrollment.course }
      setData(enrollments!.map((e) => (e.id === merged.id ? merged : e)))
      if (updated.status === "completed" && enrollment.status !== "completed") {
        setJustCertified(true)
      } else if (nextLesson) {
        setCurrentId(nextLesson.id)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="py-8">
      <Link
        href="/learning"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> My learning
      </Link>

      {showWelcome && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm text-brand-900">
            <strong>You&apos;re in!</strong> Your order was placed and the <code>order.placed</code>{" "}
            subscriber enrolled you automatically. Complete every lesson to earn your certificate.
          </p>
          <button onClick={() => setShowWelcome(false)} className="text-sm font-semibold text-brand-700">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Sidebar */}
        <aside className="self-start rounded-2xl border border-line bg-white lg:sticky lg:top-24">
          <div className="border-b border-line p-5">
            <h1 className="font-bold leading-snug">{enrollment.course.title}</h1>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={enrollment.progress_percent} />
              <span className="text-sm font-semibold">{enrollment.progress_percent}%</span>
            </div>
          </div>
          <ol className="p-2">
            {lessons.map((lesson, i) => {
              const done = completed.has(lesson.id)
              const active = lesson.id === currentId
              return (
                <li key={lesson.id}>
                  <button
                    onClick={() => setCurrentId(lesson.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                      active ? "bg-brand-50 font-semibold text-brand-900" : "hover:bg-canvas"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="size-5 shrink-0 text-brand-600" />
                    ) : (
                      <Circle className="size-5 shrink-0 text-line" />
                    )}
                    <span className="flex-1">
                      {i + 1}. {lesson.title}
                    </span>
                    <span className="text-xs text-muted">{lesson.duration_minutes}m</span>
                  </button>
                </li>
              )
            })}
          </ol>
          {enrollment.status === "completed" && (
            <div className="border-t border-line p-4">
              <Link
                href={`/certificate/${enrollment.id}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-gold-100 py-2.5 text-sm font-semibold text-gold-700 hover:bg-gold-100/70"
              >
                <Award className="size-4" /> View certificate
              </Link>
            </div>
          )}
        </aside>

        {/* Lesson */}
        {current && (
          <article className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="relative grid aspect-video place-items-center bg-gradient-to-br from-ink to-brand-900 text-white">
              <div className="text-center">
                <PlayCircle className="mx-auto size-16 opacity-90" strokeWidth={1.5} />
                <p className="mt-3 text-sm text-white/70">
                  Lesson {currentIndex + 1} of {lessons.length}
                </p>
              </div>
              <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-xs">
                <Clock className="size-3.5" /> {formatDuration(current.duration_minutes)}
              </span>
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="text-2xl font-extrabold tracking-tight">{current.title}</h2>
              <p className="mt-3 text-ink-soft">
                In this lesson you will cover the essentials of{" "}
                <strong>{current.title.toLowerCase()}</strong>. This is demo content: in
                production the lesson&apos;s <code>content_url</code> (only exposed to enrolled
                learners) would load the video or SCORM package here.
              </p>
              <ul className="mt-6 space-y-3">
                {LESSON_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" /> {point}
                  </li>
                ))}
              </ul>

              {error && <p className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

              <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                {isDone ? (
                  <p className="flex items-center gap-2 text-sm font-semibold text-brand-700">
                    <CheckCircle2 className="size-5" /> Lesson completed
                  </p>
                ) : (
                  <button
                    onClick={markComplete}
                    disabled={saving || enrollment.status === "expired"}
                    className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                  >
                    {saving ? <Spinner /> : <CheckCircle2 className="size-4" />}
                    Mark as complete{nextLesson ? " & continue" : ""}
                  </button>
                )}
                {nextLesson && (
                  <button
                    onClick={() => setCurrentId(nextLesson.id)}
                    className="flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink"
                  >
                    Next: {nextLesson.title} <ChevronRight className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </article>
        )}
      </div>

      {justCertified && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lift">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-gold-100 text-gold-700">
              <PartyPopper className="size-8" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold tracking-tight">You&apos;re certified!</h2>
            <p className="mt-2 text-muted">
              You completed <strong>{enrollment.course.title}</strong>. Your certificate code is
            </p>
            <p className="mt-3 rounded-xl bg-canvas py-2 font-mono font-semibold">
              {enrollments?.find((e) => e.id === enrollment.id)?.certificate_code}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/certificate/${enrollment.id}`}
                className="rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
              >
                View &amp; download certificate
              </Link>
              <button
                onClick={() => setJustCertified(false)}
                className="py-2 text-sm font-semibold text-muted hover:text-ink"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export default function LessonPlayerPage() {
  return (
    <RequireAuth>
      <Suspense>
        <Player />
      </Suspense>
    </RequireAuth>
  )
}
