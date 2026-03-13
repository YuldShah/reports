"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/auth-provider";
import ProtectedRoute from "@/components/protected-route";
import ProfileCard from "@/components/profile-card";
import Logo from "@/components/logo";
import AdminDashboard from "@/components/admin-dashboard";
import EmployeeDashboard from "@/components/employee-dashboard";

export default function HomePage() {
  const { isAdmin, dbUser } = useAuthContext();
  const detectShouldShowLogo = () => {
    if (typeof window === "undefined" || !window.Telegram?.WebApp) {
      return false;
    }

    const platform = window.Telegram?.WebApp?.platform?.toLowerCase() ?? "";
    return ["ios", "android"].some((value) => platform.includes(value));
  };

  const [shouldShowLogo, setShouldShowLogo] = useState(false);

  useEffect(() => {
    setShouldShowLogo(detectShouldShowLogo());
  }, []);

  const headerPaddingTop = shouldShowLogo
    ? "calc(6px + var(--tg-safe-area-inset-top, 0px))"
    : "calc(8px + var(--tg-safe-area-inset-top, 0px))";
  const contentPaddingTop = shouldShowLogo
    ? "calc(8.5rem + var(--tg-safe-area-inset-top, 0px))"
    : "calc(5.75rem + var(--tg-safe-area-inset-top, 0px))";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-mesh noise">
        <div
          className="header-halo fixed left-0 right-0 top-0 z-50"
          style={{ paddingTop: headerPaddingTop }}
        >
          <div className="mx-auto max-w-6xl px-4 pb-2">
            {shouldShowLogo ? <Logo /> : null}
            <ProfileCard />
          </div>
        </div>

        <div className="px-4 pb-10" style={{ paddingTop: contentPaddingTop }}>
          <div className="fade-in mx-auto max-w-6xl">
            {isAdmin ? (
              <AdminDashboard />
            ) : dbUser ? (
              <ProtectedRoute requireTeam>
                <EmployeeDashboard user={dbUser} />
              </ProtectedRoute>
            ) : (
              <div className="flex items-center justify-center h-40">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
