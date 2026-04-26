"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PatternEvent } from "@/lib/astro/geodetic-patterns";
import { CATEGORY_META, CATEGORY_OF } from "./categories";

const PAGE_SIZES = [25, 50, 100, 250] as const;

const fmtDate = (iso: string) => iso.slice(0, 16).replace("T", " ");
const fmtDeg = (lon?: number) => (lon === undefined ? "" : `${(lon % 30).toFixed(2)}°`);

export function UnifiedTable({ events }: { events: PatternEvent[] }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(50);

  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = useMemo(
    () => events.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [events, safePage, pageSize]
  );

  if (!events.length) {
    return (
      <div style={emptyBox}>
        No events match the current filters. Try widening the date range or adjusting the filters.
      </div>
    );
  }

  return (
    <>
      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead>
            <tr style={theadRow}>
              <th style={th}>Date (UTC)</th>
              <th style={th}>Category</th>
              <th style={th}>Event</th>
              <th style={th}>Body</th>
              <th style={th}>Sign · Deg</th>
              <th style={th}>Zone</th>
              <th style={{ ...th, textAlign: "right" }}>Flags</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((e, i) => {
              const cat = CATEGORY_META[CATEGORY_OF[e.type]];
              const isSpan = e.type === "retrograde-span" || e.type === "stellium"
                || e.type === "oob-span" || e.type === "nodal-activation"
                || e.type === "one-sided-nodal";
              const dateCell = isSpan
                ? `${fmtDate(String(e.meta?.startUtc ?? e.utc))} → ${fmtDate(String(e.meta?.endUtc ?? ""))}`
                : fmtDate(e.utc);
              const signDeg = [e.toSign ?? e.sign ?? "", fmtDeg(e.lon)].filter(Boolean).join(" · ");
              return (
                <tr key={i} style={rowStyle}>
                  <td style={tdDate}>{dateCell}</td>
                  <td style={td}>
                    <span style={{ ...badgeStyle, background: cat.bg, color: cat.fg }}>{cat.label}</span>
                  </td>
                  <td style={td}>{describe(e)}</td>
                  <td style={tdBody}>{e.body}</td>
                  <td style={td}>{signDeg}</td>
                  <td style={tdMuted}>{e.geodeticZone ?? ""}</td>
                  <td style={{ ...td, textAlign: "right" }}><Flags e={e} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pager
        page={safePage}
        totalPages={totalPages}
        pageSize={pageSize}
        total={events.length}
        onPage={(p) => setPage(p)}
        onPageSize={(s) => { setPageSize(s); setPage(0); }}
      />
    </>
  );
}

function describe(e: PatternEvent): string {
  switch (e.type) {
    case "ingress": return e.meta?.seasonal ? `${e.fromSign} → ${e.toSign} (seasonal chart)` : `${e.fromSign} → ${e.toSign}`;
    case "station": return `Station ${e.meta?.direction ?? ""}`;
    case "retrograde-span": return `Retrograde span · ${e.meta?.durationDays ?? ""}d`;
    case "aspect": return `${e.meta?.body1} ${e.meta?.aspect} ${e.meta?.body2}`;
    case "midpoint-ingress": return `${e.meta?.body1}/${e.meta?.body2} midpoint → ${e.toSign}`;
    case "stellium": return `${e.meta?.count}-planet stellium · ${e.meta?.durationDays}d`;
    case "oob-span": return `OOB ${e.meta?.hemisphere} · ${e.meta?.durationDays}d`;
    case "nodal-activation": return `Conjunct ${e.meta?.axis} · ${e.meta?.durationDays}d`;
    case "one-sided-nodal": return `${e.meta?.peakCount} planets ${e.meta?.side} of Node · ${e.meta?.durationDays}d`;
    case "sun-over-mc": return `Sun over ${e.meta?.flag ?? ""} ${e.meta?.city} MC`;
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
        <span key={f.label} style={flagBadge(f.tone)}>{f.label}</span>
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
        <span style={pagerInfo}>{page + 1} / {totalPages}</span>
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= totalPages - 1} style={pagerBtn}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

const tableWrap: React.CSSProperties = {
  overflowX: "auto",
  border: "1px solid #ddddd8",
  borderRadius: 6,
  background: "#ffffff",
};
const tableStyle: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: 12, color: "#1a1a18",
};
const theadRow: React.CSSProperties = {
  background: "#f9f8f5", textAlign: "left",
};
const th: React.CSSProperties = {
  padding: "10px 12px", fontWeight: 600, fontSize: 10,
  textTransform: "uppercase", letterSpacing: "0.06em", color: "#999",
  borderBottom: "1px solid #ddddd8", whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: 1,
};
const rowStyle: React.CSSProperties = {
  borderBottom: "1px solid #eeeeea", transition: "background 0.1s",
};
const td: React.CSSProperties = {
  padding: "9px 12px", verticalAlign: "middle", whiteSpace: "nowrap",
};
const tdDate: React.CSSProperties = {
  ...td, fontVariantNumeric: "tabular-nums", color: "#1a1a18",
};
const tdBody: React.CSSProperties = { ...td, fontWeight: 600 };
const tdMuted: React.CSSProperties = { ...td, color: "#6b6b66" };
const badgeStyle: React.CSSProperties = {
  display: "inline-block", fontSize: 10, fontWeight: 600,
  borderRadius: 3, padding: "2px 8px", whiteSpace: "nowrap",
};
const flagBadge = (tone: "rx" | "warn"): React.CSSProperties => ({
  padding: "1px 6px", fontSize: 10, fontWeight: 600, letterSpacing: "0.03em",
  border: `1px solid ${tone === "rx" ? "#0456fb" : "#e67a7a"}`,
  color: tone === "rx" ? "#0456fb" : "#e67a7a",
  borderRadius: 999, background: "transparent",
});
const pagerRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  marginTop: 10, fontSize: 11, color: "#6b6b66",
  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
};
const pagerInfo: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };
const pagerBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 26, height: 26, padding: 0,
  border: "1px solid #ddddd8", borderRadius: 4,
  background: "#fff", color: "#1a1a18", cursor: "pointer",
};
const selectStyle: React.CSSProperties = {
  padding: "3px 6px", fontSize: 11,
  border: "1px solid #ddddd8", borderRadius: 4,
  background: "#fff", color: "#1a1a18",
};
const emptyBox: React.CSSProperties = {
  padding: "2.5rem", textAlign: "center", fontSize: 13, color: "#999",
  border: "1px solid #ddddd8", borderRadius: 6, background: "#fff",
};
