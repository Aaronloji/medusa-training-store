"use client"

import { CheckCircle2, CreditCard, Lock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Container, Skeleton, Spinner } from "@/components/ui"
import { purchaseCourse, waitForEnrollment } from "@/lib/api"
import { coursePrice, formatDuration, sortLessons, totalMinutes } from "@/lib/format"
import { useCourse } from "@/lib/hooks"
import { useStore } from "@/providers/store-provider"

type Stage = "idle" | "paying" | "enrolling" | "error"

function Checkout({ handle }: { handle: string }) {
  const router = useRouter()
  const { customer, customerLoading, region } = useStore()
  const { data: course, loading } = useCourse(handle)
  // null = untouched, so the fields default to the customer's saved name.
  const [firstNameInput, setFirstName] = useState<string | null>(null)
  const [lastNameInput, setLastName] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>("idle")
  const [error, setError] = useState<string | null>(null)

  const firstName = firstNameInput ?? customer?.first_name ?? ""
  const lastName = lastNameInput ?? customer?.last_name ?? ""

  useEffect(() => {
    if (!customerLoading && !customer) {
      router.replace(`/login?next=${encodeURIComponent(`/checkout?course=${handle}`)}`)
    }
  }, [customer, customerLoading, handle, router])

  if (loading || !course || !customer) {
    return (
      <Container className="grid max-w-5xl gap-8 py-12 md:grid-cols-[1fr_380px]">
        <Skeleton className="h-96" />
        <Skeleton className="h-72" />
      </Container>
    )
  }

  const variantId = course.product?.variants?.[0]?.id
  const busy = stage === "paying" || stage === "enrolling"

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!region || !variantId) return
    setError(null)
    try {
      setStage("paying")
      await purchaseCourse({
        regionId: region.id,
        variantId,
        email: customer.email,
        firstName,
        lastName,
      })
      setStage("enrolling")
      const enrollment = await waitForEnrollment(course.id)
      router.push(enrollment ? `/learning/${enrollment.id}?welcome=1` : "/learning")
    } catch (err) {
      setStage("error")
      setError((err as Error).message)
    }
  }

  return (
    <Container className="max-w-5xl py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_380px]">
        <form onSubmit={placeOrder} className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="font-bold">Learner details</h2>
            <p className="mt-1 text-sm text-muted">This name will appear on your certificate.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="First name" value={firstName} onChange={setFirstName} />
              <Field label="Last name" value={lastName} onChange={setLastName} />
              <div className="sm:col-span-2">
                <span className="text-sm font-medium">Email</span>
                <p className="mt-1.5 rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink-soft">
                  {customer.email}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="font-bold">Payment</h2>
            <div className="mt-4 flex items-start gap-3 rounded-xl border-2 border-brand-500 bg-brand-50 p-4">
              <CreditCard className="mt-0.5 size-5 text-brand-700" />
              <div>
                <p className="font-semibold text-brand-900">Test payment</p>
                <p className="text-sm text-brand-700">
                  Medusa&apos;s built-in manual payment provider authorizes the order. No card
                  details are needed and nothing is charged.
                </p>
              </div>
            </div>
          </section>

          {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={busy || !firstName || !lastName}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {stage === "paying" && (
              <>
                <Spinner /> Placing order…
              </>
            )}
            {stage === "enrolling" && (
              <>
                <Spinner /> Setting up your course access…
              </>
            )}
            {!busy && (
              <>
                <Lock className="size-4" /> Place order · {coursePrice(course)}
              </>
            )}
          </button>
        </form>

        <aside className="md:sticky md:top-24 md:self-start">
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            {course.product?.thumbnail && (
              <div className="relative aspect-[16/8]">
                <Image src={course.product.thumbnail} alt="" fill sizes="380px" className="object-cover" />
              </div>
            )}
            <div className="p-6">
              <p className="font-bold">{course.title}</p>
              <p className="mt-1 text-sm text-muted">
                {course.lessons.length} lessons ·{" "}
                {formatDuration(totalMinutes(sortLessons(course.lessons)))}
              </p>
              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd>{coursePrice(course)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd className="text-brand-700">Digital: none</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
                  <dt>Total</dt>
                  <dd>{coursePrice(course)}</dd>
                </div>
              </dl>
              <p className="mt-5 flex items-center gap-2 text-xs text-muted">
                <CheckCircle2 className="size-4 text-brand-600" /> Instant access after checkout
              </p>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      />
    </label>
  )
}

function CheckoutFromQuery() {
  const handle = useSearchParams().get("course")
  if (!handle) {
    return (
      <Container className="py-24 text-center">
        <p className="font-semibold">Your cart is empty.</p>
        <Link href="/courses" className="mt-3 inline-block font-semibold text-brand-600">
          Browse courses →
        </Link>
      </Container>
    )
  }
  return <Checkout handle={handle} />
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutFromQuery />
    </Suspense>
  )
}
