"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PanelLeftClose, PanelLeftOpen, Plus, User } from "lucide-react";
import ThemeToggle from "@/app/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { PRIMARY_NAV, isItemActive } from "./sidebar-nav";

const RAIL_W = 64;
const EXPANDED_W = 240;

type Props = {
  pinned: boolean;
  onTogglePin: () => void;
};

export function AppSidebar({ pinned, onTogglePin }: Props) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Expanded if pinned OR hovered. When pinned, content reflows; when only
  // hovered, the panel overlays content (no layout shift).
  const expanded = pinned || hovered;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: expanded ? EXPANDED_W : RAIL_W,
        background: "var(--bg)",
        borderRight: "1px solid var(--surface-border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        transition: "width 180ms ease",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "0.75rem 0.85rem",
          height: 64,
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <Image
          src="/logo-stacked.svg"
          alt="Astro Nat"
          width={140}
          height={40}
          priority
          className="app-brand-logo"
          style={{ height: 36, width: "auto" }}
        />
      </Link>

      {/* Primary nav */}
      <nav style={{ flex: 1, padding: "0.5rem", overflowY: "auto", overflowX: "hidden" }}>
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item, pathname || "");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={expanded ? undefined : item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.55rem 0.75rem",
                margin: "0.1rem 0",
                borderRadius: "var(--radius-sm)",
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                background: active ? "var(--surface)" : "transparent",
                textDecoration: "none",
                fontSize: "0.85rem",
                whiteSpace: "nowrap",
                transition: "background 150ms ease, color 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "var(--surface)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {expanded && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* New Reading CTA — directly below the last nav item (Learn) */}
        <Link
          href="/reading/new"
          title={expanded ? undefined : "New Reading"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.55rem 0.75rem",
            margin: "0.35rem 0 0.1rem",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-y2k-blue, #0456fb)",
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            transition: "filter 150ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
        >
          <Plus size={18} style={{ flexShrink: 0 }} />
          {expanded && <span>New Reading</span>}
        </Link>
      </nav>

      {/* Footer: pin, theme, avatar */}
      <div
        style={{
          borderTop: "1px solid var(--surface-border)",
          padding: "0.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onTogglePin}
          title={pinned ? "Collapse sidebar" : "Pin sidebar open"}
          style={footerBtnStyle(expanded)}
        >
          {pinned ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          {expanded && <span>{pinned ? "Collapse" : "Pin open"}</span>}
        </button>

        <div style={footerBtnStyle(expanded)}>
          <ThemeToggleInline />
          {expanded && <span style={{ color: "var(--text-secondary)" }}>Theme</span>}
        </div>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger
              style={{
                ...footerBtnStyle(expanded),
                cursor: "pointer",
                background: "transparent",
                border: "none",
                width: "100%",
                textAlign: "left",
              }}
              title={expanded ? undefined : (user.email ?? "Account")}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--surface)",
                  border: "1px solid var(--surface-border)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <User size={14} />
              </span>
              {expanded && (
                <span
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.8rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email ?? "Account"}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="end"
              className="w-48 font-body shadow-md border border-[var(--surface-border)] bg-[var(--surface)] text-[var(--text-primary)] rounded-[var(--radius-md)] p-1"
            >
              <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                My Account
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[var(--surface-border)] h-px my-1 -mx-1" />
              <DropdownMenuItem className="cursor-pointer text-sm font-medium w-full rounded-sm hover:bg-[var(--bg-raised)] focus:bg-[var(--bg-raised)] px-2 py-1.5 outline-none transition-colors">
                <Link href="/profile" className="w-full block outline-none">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--surface-border)] h-px my-1 -mx-1" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-sm text-red-500 font-medium w-full rounded-sm hover:bg-red-500/10 focus:bg-red-500/10 px-2 py-1.5 outline-none transition-colors"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  );
}

function footerBtnStyle(expanded: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.45rem 0.5rem",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-secondary)",
    fontSize: "0.8rem",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    justifyContent: expanded ? "flex-start" : "center",
  };
}

/** Tiny wrapper so the existing ThemeToggle sits naturally in the footer row. */
function ThemeToggleInline() {
  return (
    <span style={{ display: "inline-flex", flexShrink: 0 }}>
      <ThemeToggle />
    </span>
  );
}

export const SIDEBAR_RAIL_WIDTH = RAIL_W;
export const SIDEBAR_EXPANDED_WIDTH = EXPANDED_W;
export const SIDEBAR_PIN_KEY = "astro-nat:sidebar-pinned";
