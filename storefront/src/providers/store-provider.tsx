"use client"

import type { HttpTypes } from "@medusajs/types"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { sdk } from "@/lib/medusa"

type BackendStatus = "checking" | "waking" | "ready" | "error"

type StoreContextValue = {
  backendStatus: BackendStatus
  region: HttpTypes.StoreRegion | null
  customer: HttpTypes.StoreCustomer | null
  customerLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    first_name: string
    last_name: string
  }) => Promise<void>
  logout: () => Promise<void>
}

const StoreContext = createContext<StoreContextValue | null>(null)

/**
 * The demo backend runs on a free instance that sleeps when idle.
 * Retry the (CORS-enabled) regions endpoint until it answers, so pages can
 * show a friendly "waking up" state instead of failing.
 */
async function waitForRegions(onSlow: () => void) {
  const slowTimer = setTimeout(onSlow, 2500)
  try {
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        const { regions } = await sdk.store.region.list()
        return regions
      } catch {
        // server still starting
      }
      await new Promise((r) => setTimeout(r, 3000))
    }
    return null
  } finally {
    clearTimeout(slowTimer)
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking")
  const [region, setRegion] = useState<HttpTypes.StoreRegion | null>(null)
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)
  const [customerLoading, setCustomerLoading] = useState(true)

  const loadCustomer = useCallback(async () => {
    try {
      const { customer } = await sdk.store.customer.retrieve()
      setCustomer(customer)
    } catch {
      setCustomer(null)
    } finally {
      setCustomerLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const regions = await waitForRegions(() => !cancelled && setBackendStatus("waking"))
      if (cancelled) return
      if (!regions) {
        setBackendStatus("error")
        setCustomerLoading(false)
        return
      }
      setRegion(regions.find((r) => r.currency_code === "usd") ?? regions[0] ?? null)
      setBackendStatus("ready")
      await loadCustomer()
    })()
    return () => {
      cancelled = true
    }
  }, [loadCustomer])

  const login = useCallback(
    async (email: string, password: string) => {
      const token = await sdk.auth.login("customer", "emailpass", { email, password })
      if (typeof token !== "string") {
        throw new Error("Unsupported authentication flow")
      }
      await loadCustomer()
    },
    [loadCustomer]
  )

  const register = useCallback<StoreContextValue["register"]>(
    async ({ email, password, first_name, last_name }) => {
      await sdk.auth.register("customer", "emailpass", { email, password })
      await sdk.store.customer.create({ email, first_name, last_name })
      // Log in again so the token carries the new customer id.
      await login(email, password)
    },
    [login]
  )

  const logout = useCallback(async () => {
    await sdk.auth.logout()
    setCustomer(null)
  }, [])

  const value = useMemo(
    () => ({ backendStatus, region, customer, customerLoading, login, register, logout }),
    [backendStatus, region, customer, customerLoading, login, register, logout]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>")
  return ctx
}
