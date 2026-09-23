"use client"

import { AlertTriangle, Loader2 } from "lucide-react"
import { useStore } from "@/providers/store-provider"

export function WakeBanner() {
  const { backendStatus } = useStore()

  if (backendStatus === "waking") {
    return (
      <div className="no-print flex items-center justify-center gap-2 bg-gold-100 px-4 py-2 text-center text-sm text-gold-700">
        <Loader2 className="size-4 shrink-0 animate-spin" />
        Waking up the demo server (free hosting sleeps when idle). This takes up to a minute.
      </div>
    )
  }

  if (backendStatus === "error") {
    return (
      <div className="no-print flex items-center justify-center gap-2 bg-red-50 px-4 py-2 text-center text-sm text-red-700">
        <AlertTriangle className="size-4 shrink-0" />
        The demo server is not responding right now. Please refresh in a minute.
      </div>
    )
  }

  return null
}
