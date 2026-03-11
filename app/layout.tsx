import type React from "react"
import type { Metadata } from "next"
import { DM_Sans, Outfit } from "next/font/google"
import "./globals.css"
import Script from "next/script"
import { Toaster } from "@/components/ui/toaster"
import AuthProvider from "@/components/auth-provider"
import ErrorBoundary from "@/components/error-boundary"
import { ThemeProvider } from "@/components/theme-provider"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Reports",
  description: "Team reporting system",
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
    <html lang="en" className={`${dmSans.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js?62" strategy="beforeInteractive" />
      </head>
      <body className="font-sans antialiased noise">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <ErrorBoundary>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
