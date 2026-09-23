import { Award, BookOpen, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { coursePrice, formatDuration, formatValidity, totalMinutes } from "@/lib/format"
import type { Course } from "@/lib/types"
import { LevelBadge, Skeleton } from "./ui"

export function CourseCard({ course }: { course: Course }) {
  const price = coursePrice(course)

  return (
    <Link
      href={`/courses/${course.handle}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-brand-50">
        {course.product?.thumbnail && (
          <Image
            src={course.product.thumbnail}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute left-3 top-3">
          <LevelBadge level={course.level} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug tracking-tight group-hover:text-brand-700">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{course.description}</p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-ink-soft">
          <span className="flex items-center gap-1.5">
            <BookOpen className="size-3.5" /> {course.lessons.length} lessons
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" /> {formatDuration(totalMinutes(course.lessons))}
          </span>
          <span className="flex items-center gap-1.5">
            <Award className="size-3.5" /> {formatValidity(course.certificate_validity_days)}
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <span className="text-xl font-bold">{price ?? "—"}</span>
          <span className="text-sm font-semibold text-brand-600 transition group-hover:translate-x-0.5">
            View course →
          </span>
        </div>
      </div>
    </Link>
  )
}

export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-6 h-6 w-1/3" />
      </div>
    </div>
  )
}
