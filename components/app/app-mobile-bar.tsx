"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Menu, Plus, User, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/app/components/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/ui/sheet";
import { PRIMARY_NAV, isItemActive } from "./sidebar-nav";
import { usePageHeader } from "./page-header-context";

const NAVBAR_HEIGHT = 60;

export function AppMobileBar() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { header } = usePageHeader();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Lock body scroll + flag the drawer-open state so floating page elements
  // (e.g. the dashboard FAB) can hide themselves while the drawer is up.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-app-drawer-open", "true");
    return () => {
      document.body.style.overflow = original;
      document.body.removeAttribute("data-app-drawer-open");
    };
  }, [open]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleBack = () => {
    if (!header.backTo) return;
    router.push(header.backTo);
  };

  const showBack = Boolean(header.backTo);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        background: "var(--bg)",
        borderBottom: "1px solid var(--surface-border)",
        height: NAVBAR_HEIGHT,
        display: "flex",
        alignItems: "center",
        padding: "0 0.75rem",
        gap: "0.5rem",
      }}
    >
      {showBack ? (
        <button
          onClick={handleBack}
          aria-label={header.backLabel ?? "Back"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            background: "none",
            border: "none",
            color: "var(--text-primary)",
            padding: "0.4rem 0.5rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            maxWidth: "60%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <ArrowLeft size={16} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {header.backLabel ?? "Back"}
          </span>
        </button>
      ) : (
        <Link
          href="/dashboard"
          aria-label="Astro Nat home"
          style={{ display: "inline-flex", alignItems: "center", padding: "0.25rem 0.5rem" }}
        >
          <Image
            src="/logo-stacked.svg"
            alt="Astro Nat"
            width={120}
            height={32}
            priority
            className="app-brand-logo"
            style={{ height: 28, width: "auto" }}
          />
        </Link>
      )}

      {header.title && (
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "var(--font-primary)",
            fontSize: "0.85rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "var(--text-primary)",
          }}
        >
          {header.title}
        </span>
      )}
      {!header.title && <span style={{ flex: 1 }} />}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label={open ? "Close menu" : "Open menu"}
          className="h-10 w-10 inline-flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors focus:outline-none text-[var(--text-primary)] relative z-[1200]"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </SheetTrigger>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="font-body border-l border-[var(--surface-border)] bg-[var(--surface)] text-[var(--text-primary)] p-0 sm:max-w-none"
          style={{
            top: NAVBAR_HEIGHT,
            right: 0,
            bottom: 0,
            insetBlockStart: NAVBAR_HEIGHT,
            insetBlockEnd: 0,
            width: "100vw",
            maxWidth: 420,
            height: `calc(100dvh - ${NAVBAR_HEIGHT}px)`,
          }}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>

          <div className="flex flex-col h-full">
            {/* Top: account + theme */}
            <div className="flex flex-col gap-4 px-6 pt-5 pb-5 border-b border-[var(--surface-border)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  Account
                </span>
                <ThemeToggle />
              </div>
              {user && (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 hover:text-[var(--gold)] transition-colors"
                  >
                    <span
                      className="inline-flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "var(--bg-raised, var(--surface))",
                        border: "1px solid var(--surface-border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <User size={16} />
                    </span>
                    <span className="text-sm font-body font-medium">Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      handleSignOut();
                    }}
                    className="text-left text-sm font-body font-medium text-[var(--color-spiced-life)] hover:text-red-500 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Middle: scrollable nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Explore
              </div>
              <ul className="flex flex-col">
                {PRIMARY_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item, pathname);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-3 h-14 rounded-md hover:bg-[var(--bg-raised)] active:bg-[var(--bg-raised)] transition-colors"
                        style={{
                          background: active ? "var(--bg-raised)" : "transparent",
                          color: active ? "var(--text-primary)" : "var(--text-primary)",
                        }}
                      >
                        <Icon
                          size={20}
                          className="flex-shrink-0"
                          style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}
                        />
                        <span className="text-base font-body font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Bottom: pinned New Reading CTA + safe-area */}
            <div
              className="px-4 pt-3 border-t border-[var(--surface-border)]"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
            >
              <Link
                href="/reading/new"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full h-12 rounded-md bg-[var(--color-y2k-blue,#0456fb)] text-white text-base font-body font-semibold transition-[filter] hover:brightness-110 active:brightness-95"
              >
                <Plus size={18} />
                New Reading
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
