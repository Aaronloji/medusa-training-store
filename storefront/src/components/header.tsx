"use client"

import { GraduationCap, LogOut, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useStore } from "@/providers/store-provider"
import { Logo } from "./logo"

const NAV = [
  { href: "/courses", label: "Courses" },
  { href: "/verify", label: "Verify a certificate" },
]

export function Header() {
  const { customer, customerLoading, logout } = useStore()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const links = customer ? [...NAV, { href: "/learning", label: "My learning" }] : NAV

  const handleLogout = async () => {
    await logout()
    setOpen(false)
    router.push("/")
  }

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {customerLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-line" />
          ) : customer ? (
            <>
              <span className="flex items-center gap-2 text-sm text-ink-soft">
                <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {(customer.first_name?.[0] ?? customer.email[0]).toUpperCase()}
                </span>
                {customer.first_name ?? customer.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-muted transition hover:bg-canvas hover:text-ink"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/85"
            >
              Sign in
            </Link>
          )}
        </div>

        <button
          className="rounded-lg p-2 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-white px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-canvas"
            >
              {link.label}
            </Link>
          ))}
          {customer ? (
            <button
              onClick={handleLogout}
              className="mt-1 block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-soft hover:bg-canvas"
            >
              Log out
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white"
            >
              <GraduationCap className="size-4" /> Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
