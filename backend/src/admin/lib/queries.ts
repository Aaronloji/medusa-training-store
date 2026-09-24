import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AdminCourse, CourseFormValues, NewCourseValues } from "../types"
import { sdk } from "./sdk"

// The dashboard already provides a QueryClient, so these hooks share its cache.
const keys = {
  all: ["courses"] as const,
  detail: (id: string) => ["courses", id] as const,
  byProduct: (productId: string) => ["courses", "product", productId] as const,
}

export function useCourses() {
  return useQuery({
    queryKey: keys.all,
    queryFn: () => sdk.client.fetch<{ courses: AdminCourse[]; count: number }>("/admin/courses"),
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => sdk.client.fetch<{ course: AdminCourse }>(`/admin/courses/${id}`),
  })
}

export function useProductCourse(productId: string) {
  return useQuery({
    queryKey: keys.byProduct(productId),
    queryFn: () =>
      sdk.client.fetch<{ course: AdminCourse | null }>(`/admin/products/${productId}/course`),
  })
}

export function useProductOptions() {
  return useQuery({
    queryKey: ["products", "options"],
    queryFn: () => sdk.admin.product.list({ limit: 100, fields: "id,title" }),
  })
}

export function useCreateCourse() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: NewCourseValues) =>
      sdk.client.fetch<{ course: AdminCourse }>("/admin/courses", { method: "POST", body }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
  })
}

export function useUpdateCourse(id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<CourseFormValues>) =>
      sdk.client.fetch<{ course: AdminCourse }>(`/admin/courses/${id}`, { method: "POST", body }),
    onSuccess: ({ course }) => {
      client.setQueryData(keys.detail(id), { course })
      client.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useDeleteCourse() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sdk.client.fetch(`/admin/courses/${id}`, { method: "DELETE" }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
  })
}
