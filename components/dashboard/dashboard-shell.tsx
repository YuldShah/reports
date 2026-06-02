"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Table2,
  User2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { useDashboardSession } from "@/components/dashboard/session-provider"

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/sheets", label: "Sheets", icon: Table2 },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/me", label: "My Records", icon: User2 },
]

const ROLE_LABEL: Record<string, string> = { admin: "Admin", lead: "Lead", employee: "Employee" }

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { me, logout } = useDashboardSession()

  // The login screen renders without the dashboard chrome.
  if (pathname === "/dashboard/login") {
    return <>{children}</>
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  // "My Records" is only meaningful for employees — admins/leads don't submit reports.
  const navItems = NAV.filter((item) => item.href !== "/dashboard/me" || me?.role === "employee")

  return (
    <div className="min-h-screen">
      <header className="header-halo sticky top-0 z-40 border-b border-border/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <BarChart3 className="h-5 w-5" />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight">Reports</span>
          </Link>

          <div className="flex items-center gap-2">
            {me && (
              <div className="hidden items-center gap-2.5 rounded-full border border-border/60 bg-card/70 py-1 pl-1 pr-3 sm:flex">
                {me.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={me.photoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {me.name?.slice(0, 1).toUpperCase() || "?"}
                  </span>
                )}
                <span className="text-sm font-medium leading-tight">{me.name}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                  {ROLE_LABEL[me.role] ?? me.role}
                </span>
              </div>
            )}
            <ThemeToggle />
            <button
              type="button"
              onClick={() => logout()}
              className="glass-button flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,border-color,transform] hover:border-destructive/30 hover:text-destructive active:scale-95"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="mx-auto max-w-7xl overflow-x-auto px-3 pb-2">
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="fade-in">{children}</div>
      </main>
    </div>
  )
}
