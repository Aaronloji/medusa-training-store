import Link from "next/link"
import { Logo } from "./logo"

export function Footer() {
  return (
    <footer className="no-print mt-24 border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted">
            A portfolio demo of a training marketplace built on a Medusa v2 commerce backend.
            Payments run in test mode: no card is ever charged.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
          <Link href="/courses" className="hover:text-ink">
            Courses
          </Link>
          <Link href="/verify" className="hover:text-ink">
            Verify a certificate
          </Link>
          <a
            href={process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com"}
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink"
          >
            Source on GitHub
          </a>
          <a href="https://medusajs.com" target="_blank" rel="noreferrer" className="hover:text-ink">
            Powered by Medusa
          </a>
        </div>
      </div>
    </footer>
  )
}
