"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/providers/store-provider"
import { getCourse, listCourses, listEnrollments } from "./api"
import type { Course, Enrollment, Level } from "./types"

type Result<T> = { key: string; data?: T; error?: string }

/**
 * Fetches data for a given key. Loading state is derived from whether the
 * stored result belongs to the current key, so no state is set synchronously
 * inside the effect. `initialData` (server-rendered) is shown until the
 * client fetch for the current key resolves, so there is no loading flash.
 */
function useKeyedFetch<T>(key: string | null, fetcher: () => Promise<T>, initialData?: T | null) {
  const [result, setResult] = useState<Result<T> | null>(null)

  useEffect(() => {
    if (!key) return
    let cancelled = false
    fetcher()
      .then((data) => !cancelled && setResult({ key, data }))
      .catch((e: Error) => !cancelled && setResult({ key, error: e.message }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the key captures every input
  }, [key])

  const current = key && result?.key === key ? result : null
  const data = current?.data ?? (current?.error ? null : (initialData ?? null))
  return {
    data,
    error: current?.error ?? null,
    loading: !data && !current,
    setData: (next: T) => key && setResult({ key, data: next }),
  }
}

export function useCourses(level?: Level, initialCourses?: Course[] | null) {
  const { backendStatus, region } = useStore()
  const key = backendStatus === "ready" ? `courses:${region?.id}:${level ?? "all"}` : null
  const { data, loading, error } = useKeyedFetch<Course[]>(
    key,
    () => listCourses(region?.id, level),
    initialCourses
  )
  return { data, loading, error }
}

export function useCourse(handle: string, initialCourse?: Course | null) {
  const { backendStatus, region } = useStore()
  const key = backendStatus === "ready" ? `course:${region?.id}:${handle}` : null
  const { data, loading, error } = useKeyedFetch<Course>(
    key,
    () => getCourse(handle, region?.id),
    initialCourse
  )
  return { data, loading, error }
}

export function useEnrollments() {
  const { customer, customerLoading } = useStore()
  const [version, setVersion] = useState(0)

  const key = customerLoading || !customer ? null : `enrollments:${customer.id}:${version}`
  const state = useKeyedFetch<Enrollment[]>(key, listEnrollments)

  // Signed-out visitors simply have no enrollments.
  if (!customerLoading && !customer) {
    return { data: [] as Enrollment[], loading: false, error: null, reload: () => {}, setData: () => {} }
  }

  return {
    ...state,
    loading: state.loading || customerLoading,
    reload: () => setVersion((v) => v + 1),
  }
}
