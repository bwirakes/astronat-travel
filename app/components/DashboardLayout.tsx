"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
// AppNavbar/sidebar chrome is now provided by app/(frontend)/(app)/layout.tsx
// via <AppShell />. This component remains as a shim for pages that still use
// its title/kicker/back-button affordances; migrate them to <PageHeader /> and
// remove this wrapper over time.

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  kicker?: string;
  kickerIcon?: React.ReactNode;
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
  maxWidth?: string;
  paddingTop?: string;
  paddingBottom?: string;
}

/**
 * A consistent layout for all logged-in/dashboard routes.
 * Ensures the logo returns to /home and provides a standard back button.
 */
export default function DashboardLayout({
  children,
  title,
  kicker,
  kickerIcon,
  showBack = true,
  backHref,
  backLabel = "Back",
  maxWidth = "960px",
  paddingTop = "var(--space-lg)",
  paddingBottom = "var(--space-3xl)",
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Default: hide back button on /dashboard
  const isHome = pathname === "/dashboard";
  const shouldShowBack = showBack && !isHome;

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    // No history entry (direct-landed tab) — pick a sensible parent.
    if (pathname.includes("/reading/")) {
      router.push("/readings");
    } else if (pathname.startsWith("/learn/")) {
      router.push("/learn");
    } else if (pathname.startsWith("/mundane/")) {
      router.push("/mundane");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className={`container ${paddingTop === "0" ? "home-layout-v2" : ""}`} style={{
        maxWidth, 
        paddingBottom, 
        paddingTop,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        width: "100%"
      }}>
        {shouldShowBack && (
          <button
            onClick={handleBack}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              cursor: "pointer",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "var(--space-xs)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "color 0.2s ease",
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          >
            <ArrowLeft size={14} /> {backLabel}
          </button>
        )}

        {(title || kicker) && (
          <div style={{ marginBottom: "var(--space-md)" }}>
            {kicker && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "0.25rem 0.75rem",
                  border: "1px solid currentColor",
                  borderRadius: "20px",
                  marginBottom: "var(--space-sm)",
                  color: "var(--text-tertiary)",
                }}
              >
                {kickerIcon}
                {kicker}
              </span>
            )}
            {title && (
              <h1
                style={{
                  fontFamily: "var(--font-primary)",
                  fontSize: "clamp(2.2rem, 6vw, 3.5rem)",
                  textTransform: "uppercase",
                  lineHeight: 0.9,
                  marginTop: "0.2rem",
                  letterSpacing: "-0.02em"
                }}
              >
                {title}
              </h1>
            )}
          </div>
        )}

        {children}
      </main>
  );
}
