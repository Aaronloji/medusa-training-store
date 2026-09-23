"use client"

import { ArrowLeft, BadgeCheck, Download, Link2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { RequireAuth } from "@/components/require-auth"
import { Container, Skeleton } from "@/components/ui"
import { formatDate, formatDuration, totalMinutes } from "@/lib/format"
import { useEnrollments } from "@/lib/hooks"
import { useStore } from "@/providers/store-provider"

function Certificate() {
  const { id } = useParams<{ id: string }>()
  const { customer } = useStore()
  const { data: enrollments, loading } = useEnrollments()
  const [copied, setCopied] = useState(false)
  const enrollment = enrollments?.find((e) => e.id === id)

  if (loading) {
    return (
      <Container className="max-w-4xl py-12">
        <Skeleton className="aspect-[1.414] w-full" />
      </Container>
    )
  }

  if (!enrollment?.certificate_code) {
    return (
      <Container className="py-24 text-center">
        <p className="font-semibold">This certificate isn&apos;t available yet.</p>
        <p className="mt-1 text-sm text-muted">Complete every lesson in the course to earn it.</p>
        <Link href="/learning" className="mt-4 inline-block font-semibold text-brand-600">
          ← My learning
        </Link>
      </Container>
    )
  }

  const name = [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || customer?.email
  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify?code=${enrollment.certificate_code}`
      : ""

  return (
    <Container className="max-w-4xl py-10">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/learning" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> My learning
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(verifyUrl)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:border-ink/20"
          >
            <Link2 className="size-4" /> {copied ? "Link copied!" : "Copy verification link"}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/85"
          >
            <Download className="size-4" /> Download PDF
          </button>
        </div>
      </div>

      <div className="relative aspect-[1.414] w-full overflow-hidden rounded-2xl bg-[#fffdf7] p-[4%] shadow-lift print:rounded-none print:shadow-none">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(40rem_20rem_at_100%_0%,var(--color-gold-100),transparent_70%),radial-gradient(30rem_20rem_at_0%_100%,var(--color-brand-50),transparent_70%)]"
        />
        <div className="relative flex h-full flex-col items-center justify-between rounded-xl border-[3px] border-double border-gold-500/50 px-[6%] py-[5%] text-center">
          <div>
            <p className="text-[clamp(10px,1.4vw,14px)] font-bold uppercase tracking-[0.35em] text-gold-700">
              Certificate of completion
            </p>
            <p className="mt-[3%] text-[clamp(11px,1.5vw,15px)] text-ink-soft">This certifies that</p>
          </div>

          <div>
            <p className="font-serif text-[clamp(28px,5.5vw,56px)] font-semibold leading-tight">{name}</p>
            <div className="mx-auto my-[3%] h-px w-2/3 bg-gold-500/40" />
            <p className="text-[clamp(11px,1.5vw,15px)] text-ink-soft">has successfully completed</p>
            <p className="mt-2 text-[clamp(16px,2.6vw,26px)] font-bold tracking-tight">
              {enrollment.course.title}
            </p>
            <p className="mt-2 text-[clamp(10px,1.3vw,13px)] text-muted">
              {enrollment.course.lessons.length} lessons ·{" "}
              {formatDuration(totalMinutes(enrollment.course.lessons))} of training
            </p>
          </div>

          <div className="grid w-full grid-cols-3 items-end text-[clamp(9px,1.2vw,12px)]">
            <div className="text-left">
              <p className="font-semibold text-ink">{formatDate(enrollment.completed_at)}</p>
              <p className="text-muted">Date issued</p>
            </div>
            <div className="flex justify-center">
              <span className="grid size-[clamp(48px,9vw,88px)] place-items-center rounded-full bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-lg ring-4 ring-gold-100">
                <BadgeCheck className="size-1/2" />
              </span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-ink">
                {enrollment.expires_at ? formatDate(enrollment.expires_at) : "No expiry"}
              </p>
              <p className="text-muted">Valid until</p>
            </div>
          </div>

          <p className="font-mono text-[clamp(9px,1.1vw,11px)] text-muted">
            {enrollment.certificate_code} · Verify at {verifyUrl.replace(/^https?:\/\//, "").split("?")[0]}
          </p>
        </div>
      </div>
    </Container>
  )
}

export default function CertificatePage() {
  return (
    <RequireAuth>
      <Certificate />
    </RequireAuth>
  )
}
