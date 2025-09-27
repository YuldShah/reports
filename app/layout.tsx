import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import AuthProvider from "@/components/auth-provider"
import ErrorBoundary from "@/components/error-boundary"
import TelegramScript from "@/components/telegram-script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Reports App - Team Reporting System",
  description: "Submit and manage team reports through Telegram integration",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        <TelegramScript />
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
