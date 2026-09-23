import type { Metadata } from "next"
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { WakeBanner } from "@/components/wake-banner"
import { StoreProvider } from "@/providers/store-provider"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" })
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" })

export const metadata: Metadata = {
  title: {
    default: "CertPath: Compliance training, certified",
    template: "%s · CertPath",
  },
  description:
    "Online OSHA, HIPAA, food safety and workplace compliance courses with verifiable certificates. Built on Medusa v2.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${fraunces.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <StoreProvider>
          <WakeBanner />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  )
}
