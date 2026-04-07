"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AppNavbar from "./AppNavbar";

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

  // Default: hide back button on /home
  const isHome = pathname === "/home";
  const shouldShowBack = showBack && !isHome;

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      // If we're deepening into a resource, back might be better to go to a specific parent
      if (pathname.includes("/reading/")) {
        router.push("/readings?demo=true");
      } else {
        router.push("/home");
      }
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "var(--bg)", 
      color: "var(--text-primary)",
      display: "flex",
      flexDirection: "column"
    }}>
      <AppNavbar />

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
              marginBottom: "var(--space-md)",
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
          <div style={{ marginBottom: "var(--space-xl)" }}>
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
    </div>
  );
}
