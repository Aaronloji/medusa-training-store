"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/providers/store-provider"
import { getCourse, listCourses, listEnrollments } from "./api"
import type { Course, Enrollment, Level } from "./types"

type Result<T> = { key: string; data?: T; error?: string }

/**
 * Fetches data for a given key. Loading state is derived from whether the
 * stored result belongs to the current key, so no state is set synchronously
 * inside the effect.
 */
function useKeyedFetch<T>(key: string | null, fetcher: () => Promise<T>) {
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

  const loading = !key || result?.key !== key
  return {
    data: loading ? null : (result?.data ?? null),
    error: loading ? null : (result?.error ?? null),
    loading,
    setData: (data: T) => key && setResult({ key, data }),
  }
}

export function useCourses(level?: Level) {
  const { backendStatus, region } = useStore()
  const key = backendStatus === "ready" ? `courses:${region?.id}:${level ?? "all"}` : null
  const { data, loading, error } = useKeyedFetch<Course[]>(key, () =>
    listCourses(region?.id, level)
  )
  return { data, loading, error }
}

export function useCourse(handle: string) {
  const { backendStatus, region } = useStore()
  const key = backendStatus === "ready" ? `course:${region?.id}:${handle}` : null
  const { data, loading, error } = useKeyedFetch<Course>(key, () => getCourse(handle, region?.id))
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
    reload: () => setVersion((v) => v + 1),
  }
}
