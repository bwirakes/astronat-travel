"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppSidebar, SIDEBAR_EXPANDED_WIDTH, SIDEBAR_PIN_KEY, SIDEBAR_RAIL_WIDTH } from "./app-sidebar";
import { AppMobileBar } from "./app-mobile-bar";
import { PageHeaderProvider, usePageHeader } from "./page-header-context";

const MOBILE_QUERY = "(max-width: 767px)";
const CONTENT_MAX_WIDTH = 1440;
// Routes that intentionally bypass the (app) chrome (sidebar, top bar, context bar).
// /flow is the onboarding experience and renders its own minimal header.
const NO_CHROME_PREFIXES = ["/flow"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  if (NO_CHROME_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return <>{children}</>;
  }
  return (
    <PageHeaderProvider>
      <Shell>{children}</Shell>
    </PageHeaderProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [pinned, setPinned] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    try {
      setPinned(localStorage.getItem(SIDEBAR_PIN_KEY) === "1");
    } catch {}
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const togglePin = () => {
    setPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_PIN_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const desktopOffset = pinned ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_RAIL_WIDTH;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-primary)" }}>
      {!isMobile && <AppSidebar pinned={pinned} onTogglePin={togglePin} />}
      {isMobile && <AppMobileBar />}

      <div
        style={{
          paddingLeft: isMobile ? 0 : desktopOffset,
          transition: "padding-left 180ms ease",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {!isMobile && <DesktopContextBar />}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            maxWidth: CONTENT_MAX_WIDTH,
            margin: "0 auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Slim sticky bar above the page content. Only renders when a page has
 * registered a title or backTo via <PageHeader />. Pages that haven't been
 * migrated to the new pattern simply don't render it — no double headers.
 */
function DesktopContextBar() {
  const router = useRouter();
  const { header } = usePageHeader();
  const showBack = Boolean(header.backTo);
  const showTitle = Boolean(header.title);
  const hasContent = showBack || showTitle || Boolean(header.actions);
  // Always reserve 44px so every page starts at the same vertical offset.
  // When empty, render a transparent spacer (no border, no background).

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 44,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0 1.25rem",
        background: hasContent ? "var(--bg)" : "transparent",
        borderBottom: hasContent ? "1px solid var(--surface-border)" : "none",
      }}
    >
      {showBack && (
        <button
          onClick={() => header.backTo && router.push(header.backTo)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "none",
            border: "none",
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
            padding: "0.25rem 0.4rem",
            borderRadius: "var(--radius-sm)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
        >
          <ArrowLeft size={14} /> {header.backLabel ?? "Back"}
        </button>
      )}

      {showTitle && (
        <span
          style={{
            fontFamily: "var(--font-primary)",
            fontSize: "0.85rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {header.title}
        </span>
      )}

      <span style={{ flex: 1 }} />

      {header.actions}
    </div>
  );
}
