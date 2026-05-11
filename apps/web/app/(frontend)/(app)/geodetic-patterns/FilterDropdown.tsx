"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

interface Props {
  label: string;
  options: readonly string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Render an "All / None" shortcut row. */
  showAllNone?: boolean;
}

/**
 * Accessible multi-select dropdown. Click the trigger to toggle; click outside
 * closes it. Shows "{label} · {n}/{total}" so users see coverage at a glance.
 */
export function FilterDropdown({ label, options, selected, onChange, showAllNone = true }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = (opt: string) => {
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt); else next.add(opt);
    onChange(next);
  };

  const allSelected = selected.size === options.length;
  const noneSelected = selected.size === 0;
  const summary = allSelected
    ? `all ${options.length}`
    : noneSelected
    ? "none"
    : `${selected.size}/${options.length}`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={triggerStyle}>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </span>
        <span style={{ fontSize: "0.85rem" }}>{summary}</span>
        <ChevronDown size={14} style={{ opacity: 0.6, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div style={panelStyle} role="listbox">
          {showAllNone && (
            <div style={allNoneRow}>
              <button type="button" style={linkBtn} onClick={() => onChange(new Set(options))}>Select all</button>
              <button type="button" style={linkBtn} onClick={() => onChange(new Set())}>Clear</button>
            </div>
          )}
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {options.map((opt) => {
              const checked = selected.has(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => toggle(opt)}
                  style={{ ...optionRow, background: checked ? "var(--bg-subtle, rgba(0,0,0,0.03))" : "transparent" }}
                  role="option"
                  aria-selected={checked}
                >
                  <span style={{ width: 14, display: "inline-flex", justifyContent: "center" }}>
                    {checked ? <Check size={12} /> : null}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const triggerStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "6px 12px", minWidth: 160,
  border: "1px solid var(--border-subtle)", borderRadius: 6,
  background: "transparent", color: "var(--text-primary)", cursor: "pointer",
  fontFamily: "var(--font-body)",
};
const panelStyle: React.CSSProperties = {
  position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
  minWidth: 220,
  background: "var(--bg-primary, #fff)",
  border: "1px solid var(--border-subtle)", borderRadius: 6,
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
};
const allNoneRow: React.CSSProperties = {
  display: "flex", gap: 12, padding: "8px 12px",
  borderBottom: "1px solid var(--border-subtle)",
};
const linkBtn: React.CSSProperties = {
  padding: 0, border: "none", background: "transparent",
  fontFamily: "var(--font-body)", fontSize: "0.74rem",
  color: "var(--text-secondary)", cursor: "pointer", textDecoration: "underline",
};
const optionRow: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  width: "100%", padding: "7px 12px",
  border: "none", background: "transparent", cursor: "pointer",
  textAlign: "left", fontFamily: "var(--font-body)", fontSize: "0.85rem",
  color: "var(--text-primary)",
};
