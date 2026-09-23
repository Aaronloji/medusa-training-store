"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useStore } from "@/providers/store-provider"
import { Container, Skeleton } from "./ui"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { customer, customerLoading } = useStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!customerLoading && !customer) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [customer, customerLoading, pathname, router])

  if (!customer) {
    return (
      <Container className="space-y-4 py-12">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </Container>
    )
  }

  return <>{children}</>
}
