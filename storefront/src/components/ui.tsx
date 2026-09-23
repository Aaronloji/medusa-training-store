import type { EnrollmentStatus, Level } from "@/lib/types"

const LEVEL_STYLES: Record<Level, string> = {
  beginner: "bg-brand-50 text-brand-700 ring-brand-200",
  intermediate: "bg-sky-50 text-sky-700 ring-sky-200",
  advanced: "bg-violet-50 text-violet-700 ring-violet-200",
}

export function LevelBadge({ level }: { level: Level }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${LEVEL_STYLES[level]}`}
    >
      {level}
    </span>
  )
}

const STATUS_STYLES: Record<EnrollmentStatus, { label: string; className: string }> = {
  active: { label: "In progress", className: "bg-sky-50 text-sky-700 ring-sky-200" },
  completed: { label: "Certified", className: "bg-brand-50 text-brand-700 ring-brand-200" },
  expired: { label: "Expired", className: "bg-red-50 text-red-700 ring-red-200" },
}

export function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.className}`}
    >
      {s.label}
    </span>
  )
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-line ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-700 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-line/80 ${className}`} />
}

export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
