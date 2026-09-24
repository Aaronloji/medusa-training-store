"use client"

import { ArrowRight, BadgeCheck, CreditCard, PlayCircle, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { CourseCard, CourseCardSkeleton } from "@/components/course-card"
import { Container } from "@/components/ui"
import { useCourses } from "@/lib/hooks"
import type { Course } from "@/lib/types"

const STEPS = [
  {
    icon: CreditCard,
    title: "Enroll in seconds",
    text: "Checkout runs on Medusa's cart and payment flow. Access is granted the moment the order is placed.",
  },
  {
    icon: PlayCircle,
    title: "Learn at your pace",
    text: "Progress is saved lesson by lesson, so you can pick up right where you left off.",
  },
  {
    icon: BadgeCheck,
    title: "Get certified",
    text: "Finish every lesson to earn a certificate with a unique code employers can verify online.",
  },
]

export function HomeView({ initialCourses }: { initialCourses: Course[] | null }) {
  const { data: courses, loading } = useCourses(undefined, initialCourses)

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_85%_-10%,var(--color-brand-100),transparent_60%)]"
        />
        <Container className="relative grid gap-12 py-16 md:grid-cols-[1.15fr_1fr] md:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <ShieldCheck className="size-3.5" /> OSHA · HIPAA · Food safety · Workplace
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Compliance training that keeps your team{" "}
              <span className="font-serif font-semibold italic text-brand-600">certified</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-soft">
              Self-paced online courses with verifiable certificates that track their own expiry
              dates, so renewals never slip through the cracks.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Browse courses <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 font-semibold transition hover:border-ink/20"
              >
                Verify a certificate
              </Link>
            </div>
          </div>

          {/* Certificate preview */}
          <div className="relative hidden items-center md:flex">
            <div className="absolute -right-6 top-6 h-64 w-64 rounded-full bg-gold-100 blur-3xl" aria-hidden />
            <div className="relative w-full rotate-2 rounded-2xl border border-gold-500/30 bg-[#fffdf7] p-8 shadow-lift">
              <div className="rounded-xl border-2 border-double border-gold-500/40 p-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-700">
                  Certificate of completion
                </p>
                <p className="mt-4 font-serif text-3xl font-semibold">Jordan Rivera</p>
                <p className="mt-3 text-sm text-ink-soft">has successfully completed</p>
                <p className="mt-1 font-semibold">HIPAA Training for Healthcare Workers</p>
                <div className="mt-6 flex items-center justify-between text-left text-[11px] text-muted">
                  <div>
                    <p className="font-semibold text-ink">CERT-20260923-7F3A9C</p>
                    <p>Valid until Sep 23, 2027</p>
                  </div>
                  <span className="grid size-12 place-items-center rounded-full bg-gold-500 text-white shadow">
                    <BadgeCheck className="size-6" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Featured courses */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Popular courses</h2>
              <p className="mt-2 text-muted">Accepted by employers and required by regulators.</p>
            </div>
            <Link href="/courses" className="hidden text-sm font-semibold text-brand-600 hover:text-brand-700 sm:block">
              See all courses →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading || !courses
              ? Array.from({ length: 3 }).map((_, i) => <CourseCardSkeleton key={i} />)
              : courses.slice(0, 3).map((course) => <CourseCard key={course.id} course={course} />)}
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-white py-16 md:py-20">
        <Container>
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl border border-line bg-canvas p-6">
                <span className="absolute right-5 top-5 font-serif text-4xl font-semibold text-line">
                  {i + 1}
                </span>
                <span className="grid size-11 place-items-center rounded-xl bg-brand-600 text-white">
                  <step.icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Demo CTA */}
      <section className="pt-16 md:pt-20">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink p-8 text-white md:flex-row md:items-center md:p-12">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Try the full flow in two minutes</h2>
              <p className="mt-2 max-w-xl text-white/70">
                Sign in with the demo account, buy a course (test payment, no card needed),
                complete its lessons and download your certificate.
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 rounded-xl bg-white px-5 py-3 font-semibold text-ink transition hover:bg-brand-50"
            >
              Use the demo account
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
