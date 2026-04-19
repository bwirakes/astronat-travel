"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { PatternEvent } from "@/lib/astro/geodetic-patterns";
import { downloadCsv, eventsToCsv } from "./csv";

interface Props {
  title: string;
  events: PatternEvent[];
  filenameSlug: string;
  defaultPageSize?: number;
}

const PAGE_SIZES = [25, 50, 100, 250] as const;

const fmtDate = (iso: string) => iso.slice(0, 16).replace("T", " ");
const fmtDeg = (lon?: number) => (lon === undefined ? "" : `${(lon % 30).toFixed(2)}°`);

export function EventTable({ title, events, filenameSlug, defaultPageSize = 25 }: Props) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = useMemo(
    () => events.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [events, safePage, pageSize]
  );

  if (!events.length) return null;

  return (
    <section style={{ marginBottom: "var(--space-xl)" }}>
      <header style={headerRow}>
        <h2 style={titleStyle}>
          {title}{" "}
          <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
            ({events.length.toLocaleString()})
          </span>
        </h2>
        <button
          type="button"
          onClick={() => downloadCsv(`geodetic-${filenameSlug}.csv`, eventsToCsv(events))}
          style={csvBtn}
        >
          <Download size={12} /> CSV
        </button>
      </header>

      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead>
            <tr style={theadRow}>
              <th style={th}>Date (UTC)</th>
              <th style={th}>Body</th>
              <th style={th}>Event</th>
              <th style={th}>Sign · Deg</th>
              <th style={th}>Zone</th>
              <th style={{ ...th, textAlign: "right" }}>Flags</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((e, i) => {
              const isSpan = e.type === "retrograde-span";
              const dateCell = isSpan
                ? `${fmtDate(String(e.meta?.startUtc ?? e.utc))} → ${fmtDate(String(e.meta?.endUtc ?? ""))}`
                : fmtDate(e.utc);
              const signDeg = (() => {
                const s = e.toSign ?? e.sign ?? "";
                const d = fmtDeg(e.lon);
                return [s, d].filter(Boolean).join(" · ");
              })();
              return (
                <tr key={i} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <td style={td}>{dateCell}</td>
                  <td style={{ ...td, fontWeight: 500 }}>{e.body}</td>
                  <td style={td}>{describe(e)}</td>
                  <td style={td}>{signDeg}</td>
                  <td style={{ ...td, color: "var(--text-secondary)" }}>{e.geodeticZone ?? ""}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <Flags e={e} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {events.length > Math.min(...PAGE_SIZES) && (
        <Pager
          page={safePage}
          totalPages={totalPages}
          pageSize={pageSize}
          total={events.length}
          onPage={(p) => setPage(p)}
          onPageSize={(s) => { setPageSize(s); setPage(0); }}
        />
      )}
    </section>
  );
}

function describe(e: PatternEvent): string {
  switch (e.type) {
    case "ingress": return `${e.fromSign} → ${e.toSign}`;
    case "station": return `Station ${e.meta?.direction ?? ""}`;
    case "retrograde-span": return `Retrograde · ${e.meta?.durationDays ?? ""}d`;
    case "aspect": return `${e.meta?.body1} ${e.meta?.aspect} ${e.meta?.body2}`;
    case "midpoint-ingress": return `${e.meta?.body1}/${e.meta?.body2} midpoint → ${e.toSign}`;
    case "eclipse-solar": return `Solar eclipse · ${e.meta?.eclipseType ?? ""}`;
    case "eclipse-lunar": return `Lunar eclipse · ${e.meta?.eclipseType ?? ""}`;
    case "lunation-new": return "New Moon";
    case "lunation-full": return "Full Moon";
  }
}

function Flags({ e }: { e: PatternEvent }) {
  const flags: Array<{ label: string; tone: "rx" | "warn" }> = [];
  if (e.meta?.retrograde === true || e.type === "retrograde-span") flags.push({ label: "Rx", tone: "rx" });
  if (e.meta?.anaretic === true) flags.push({ label: "29°", tone: "warn" });
  if (!flags.length) return null;
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {flags.map((f) => (
        <span key={f.label} style={badge(f.tone)}>{f.label}</span>
      ))}
    </span>
  );
}

function Pager({
  page, totalPages, pageSize, total, onPage, onPageSize,
}: {
  page: number; totalPages: number; pageSize: number; total: number;
  onPage: (p: number) => void; onPageSize: (s: number) => void;
}) {
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);
  return (
    <div style={pagerRow}>
      <span style={pagerInfo}>
        {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          style={selectStyle}
          aria-label="Rows per page"
        >
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}/page</option>)}
        </select>
        <button type="button" onClick={() => onPage(page - 1)} disabled={page === 0} style={pagerBtn}>
          <ChevronLeft size={14} />
        </button>
        <span style={pagerInfo}>
          {page + 1} / {totalPages}
        </span>
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= totalPages - 1} style={pagerBtn}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

const headerRow: React.CSSProperties = {
  display: "flex", alignItems: "baseline", justifyContent: "space-between",
  marginBottom: "var(--space-sm)",
};
const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontSize: "1.05rem", color: "var(--text-primary)",
};
const csvBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
  fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--text-secondary)",
  border: "1px solid var(--border-subtle)", borderRadius: 4, background: "transparent", cursor: "pointer",
};
const tableWrap: React.CSSProperties = {
  overflowX: "auto", border: "1px solid var(--border-subtle)", borderRadius: 4,
};
const tableStyle: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: "0.85rem",
};
const theadRow: React.CSSProperties = {
  background: "var(--bg-subtle, transparent)", color: "var(--text-secondary)", textAlign: "left",
};
const th: React.CSSProperties = {
  padding: "10px 12px", fontWeight: 500, fontSize: "0.72rem",
  textTransform: "uppercase", letterSpacing: "0.05em",
  borderBottom: "1px solid var(--border-subtle)",
};
const td: React.CSSProperties = {
  padding: "8px 12px", color: "var(--text-primary)", verticalAlign: "middle",
  whiteSpace: "nowrap",
};
const pagerRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  marginTop: 10, fontFamily: "var(--font-body)", fontSize: "0.78rem",
  color: "var(--text-secondary)",
};
const pagerInfo: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };
const pagerBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 26, height: 26, padding: 0,
  border: "1px solid var(--border-subtle)", borderRadius: 4,
  background: "transparent", color: "var(--text-primary)", cursor: "pointer",
};
const selectStyle: React.CSSProperties = {
  padding: "3px 6px", fontFamily: "var(--font-body)", fontSize: "0.78rem",
  border: "1px solid var(--border-subtle)", borderRadius: 4,
  background: "transparent", color: "var(--text-primary)",
};
const badge = (tone: "rx" | "warn"): React.CSSProperties => ({
  padding: "1px 6px", fontFamily: "var(--font-body)", fontSize: "0.68rem",
  fontWeight: 500, letterSpacing: "0.03em",
  border: `1px solid ${tone === "rx" ? "var(--color-y2k-blue, #0456fb)" : "var(--color-spiced-life, #e67a7a)"}`,
  color: tone === "rx" ? "var(--color-y2k-blue, #0456fb)" : "var(--color-spiced-life, #e67a7a)",
  borderRadius: 999, background: "transparent",
});
