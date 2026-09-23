"use client"

import { Sparkles } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Logo } from "@/components/logo"
import { Spinner } from "@/components/ui"
import { useStore } from "@/providers/store-provider"

const DEMO = { email: "demo@learner.com", password: "demo1234" }

function LoginForm() {
  const router = useRouter()
  const next = useSearchParams().get("next") || "/learning"
  const { customer, login, register, backendStatus } = useStore()

  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (customer) router.replace(next)
  }, [customer, next, router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (mode === "login") {
        await login(email, password)
      } else {
        await register({ email, password, first_name: firstName, last_name: lastName })
      }
    } catch (err) {
      const message = (err as Error).message
      setError(
        mode === "login" && /unauthorized|invalid/i.test(message)
          ? "Wrong email or password."
          : message
      )
      setSubmitting(false)
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your learner account"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "login"
              ? "Sign in to continue your training."
              : "Start learning and earn verifiable certificates."}
          </p>
        </div>

        <div className="mb-5 rounded-2xl border border-gold-500/30 bg-gold-100/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-gold-700">
            <Sparkles className="size-4" /> Reviewing this demo?
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Use <strong>{DEMO.email}</strong> / <strong>{DEMO.password}</strong>, or create your
            own account.
          </p>
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setEmail(DEMO.email)
              setPassword(DEMO.password)
            }}
            className="mt-3 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gold-700 shadow-sm ring-1 ring-gold-500/30 transition hover:bg-gold-100"
          >
            Fill in demo credentials
          </button>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-line bg-white p-6 shadow-card">
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-canvas p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setError(null)
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  mode === m ? "bg-white text-ink shadow-sm" : "text-muted"
                }`}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium">First name</span>
                  <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Last name</span>
                  <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
                </label>
              </div>
            )}
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting || backendStatus !== "ready"}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 font-semibold text-white transition hover:bg-ink/85 disabled:opacity-60"
          >
            {submitting && <Spinner />}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
