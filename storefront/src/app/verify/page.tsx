"use client"

import { BadgeCheck, SearchCheck, XCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Container, Spinner } from "@/components/ui"
import { verifyCertificate } from "@/lib/api"
import { formatDate } from "@/lib/format"
import type { CertificateVerification } from "@/lib/types"
import { useStore } from "@/providers/store-provider"

type Result =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "found"; certificate: CertificateVerification }
  | { state: "not-found" }

function Verify() {
  const router = useRouter()
  const initialCode = useSearchParams().get("code") ?? ""
  const { backendStatus } = useStore()
  const [code, setCode] = useState(initialCode)
  // Each submitted lookup gets a new nonce so re-verifying the same code refetches.
  const [lookupRequest, setLookupRequest] = useState({ code: initialCode, nonce: 0 })
  const [result, setResult] = useState<Result>(
    initialCode ? { state: "loading" } : { state: "idle" }
  )

  const lookup = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setResult({ state: "loading" })
    setLookupRequest((r) => ({ code: trimmed, nonce: r.nonce + 1 }))
    // Keep the URL shareable (e.g. linked from a certificate).
    router.replace(`/verify?code=${encodeURIComponent(trimmed)}`, { scroll: false })
  }

  useEffect(() => {
    if (!lookupRequest.code || backendStatus !== "ready") return
    let cancelled = false
    verifyCertificate(lookupRequest.code)
      .then((certificate) => !cancelled && setResult({ state: "found", certificate }))
      .catch(() => !cancelled && setResult({ state: "not-found" }))
    return () => {
      cancelled = true
    }
  }, [lookupRequest, backendStatus])

  return (
    <Container className="max-w-2xl py-16">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <SearchCheck className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Verify a certificate</h1>
        <p className="mt-2 text-muted">
          Employers and auditors can confirm a certificate is genuine and still valid.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          lookup(code)
        }}
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CERT-20260923-7F3A9C"
          className="flex-1 rounded-xl border border-line bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={result.state === "loading" || backendStatus !== "ready"}
          className="flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 font-semibold text-white hover:bg-ink/85 disabled:opacity-60"
        >
          {result.state === "loading" && <Spinner />} Verify
        </button>
      </form>

      {result.state === "found" && (
        <div
          className={`mt-8 rounded-2xl border p-6 ${
            result.certificate.valid ? "border-brand-200 bg-brand-50" : "border-red-200 bg-red-50"
          }`}
        >
          <p
            className={`flex items-center gap-2 font-bold ${
              result.certificate.valid ? "text-brand-700" : "text-red-700"
            }`}
          >
            {result.certificate.valid ? (
              <>
                <BadgeCheck className="size-5" /> Valid certificate
              </>
            ) : (
              <>
                <XCircle className="size-5" /> This certificate has expired
              </>
            )}
          </p>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            {[
              ["Holder", result.certificate.holder || "—"],
              ["Course", result.certificate.course],
              ["Issued", formatDate(result.certificate.issued_at)],
              [
                "Valid until",
                result.certificate.expires_at ? formatDate(result.certificate.expires_at) : "No expiry",
              ],
              ["Code", result.certificate.code],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted">{label}</dt>
                <dd className="mt-0.5 font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {result.state === "not-found" && (
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <XCircle className="size-5 shrink-0" />
          No certificate matches this code. Check for typos and try again.
        </div>
      )}
    </Container>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  )
}
