"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Download } from "lucide-react";
import DashboardLayout from "@/app/components/DashboardLayout";
import type { EventType, PatternEvent } from "@/lib/astro/geodetic-patterns";
import { BODIES, GEN_END_YEAR, GEN_START_YEAR } from "@/lib/astro/geodetic-patterns";
import { loadEventsRange } from "./actions";
import { EventTable } from "./EventTable";
import { downloadCsv, eventsToCsv } from "./csv";

const TYPE_GROUPS: Array<{ key: EventType; label: string; slug: string }> = [
  { key: "ingress",            label: "Ingresses",        slug: "ingresses" },
  { key: "station",            label: "Stations",         slug: "stations" },
  { key: "retrograde-span",    label: "Retrograde Spans", slug: "retrograde-spans" },
  { key: "aspect",             label: "Aspects (outer)",  slug: "aspects" },
  { key: "midpoint-ingress",   label: "Midpoint Ingresses", slug: "midpoint-ingresses" },
  { key: "eclipse-solar",      label: "Solar Eclipses",   slug: "solar-eclipses" },
  { key: "eclipse-lunar",      label: "Lunar Eclipses",   slug: "lunar-eclipses" },
  { key: "lunation-new",       label: "New Moons",        slug: "new-moons" },
  { key: "lunation-full",      label: "Full Moons",       slug: "full-moons" },
];

export default function GeodeticPatternsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(`${new Date().getUTCFullYear()}-01-01`);
  const [to, setTo] = useState(today);
  const [enabled, setEnabled] = useState<Record<EventType, boolean>>({
    "ingress": true, "station": true,
    "retrograde-span": true, "aspect": true, "midpoint-ingress": false,
    "eclipse-solar": true, "eclipse-lunar": true,
    "lunation-new": false, "lunation-full": false,
  });
  const [anareticOnly, setAnareticOnly] = useState(false);
  const allBodies = useMemo(() => Object.keys(BODIES), []);
  const [bodyFilter, setBodyFilter] = useState<Set<string>>(new Set(allBodies));
  const [events, setEvents] = useState<PatternEvent[]>([]);
  const [isPending, startTransition] = useTransition();

  const toggleBody = (b: string) => setBodyFilter((prev) => {
    const next = new Set(prev);
    if (next.has(b)) next.delete(b); else next.add(b);
    return next;
  });

  const fetchRange = (f: string, t: string) => {
    startTransition(async () => {
      const fromIso = `${f}T00:00:00Z`;
      const toIso = `${t}T23:59:59Z`;
      const result = await loadEventsRange(fromIso, toIso);
      setEvents(result);
    });
  };

  useEffect(() => { fetchRange(from, to); /* eslint-disable-next-line */ }, []);

  // Pull constituent body names out of single ("Mars") or compound ("Jupiter-Saturn", "Sun/Moon") body strings.
  const bodyMatches = (e: PatternEvent) => {
    if (bodyFilter.size === allBodies.length) return true; // all selected ⇒ no-op
    const parts = e.body.split(/[-/]/).map((s) => s.trim());
    return parts.some((p) => bodyFilter.has(p));
  };
  const passes = (e: PatternEvent) =>
    enabled[e.type] && bodyMatches(e) && (!anareticOnly || e.meta?.anaretic === true);

  const grouped = useMemo(() => {
    const out: Record<EventType, PatternEvent[]> = {
      "ingress": [], "station": [],
      "retrograde-span": [], "aspect": [], "midpoint-ingress": [],
      "eclipse-solar": [], "eclipse-lunar": [],
      "lunation-new": [], "lunation-full": [],
    };
    for (const e of events) if (passes(e)) out[e.type].push(e);
    return out;
  }, [events, enabled, anareticOnly, bodyFilter]);

  const visibleAll = useMemo(() => events.filter(passes), [events, enabled, anareticOnly, bodyFilter]);

  return (
    <DashboardLayout
      title="Geodetic Patterns"
      kicker="RESEARCH"
      backLabel="Geodetic"
      backHref="/geodetic"
      paddingTop="var(--space-lg)"
      maxWidth="980px"
    >
      <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.92rem", maxWidth: 560, marginBottom: "var(--space-lg)" }}>
        Pick a date range to surface every ingress, station, eclipse, and lunation in that window — tagged
        with the geodetic meridian band each event activates. Data: {GEN_START_YEAR}–{GEN_END_YEAR}.
        Export any table to CSV for correlation against historical events.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "end", marginBottom: "var(--space-lg)" }}>
        <Field label="From"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={input} /></Field>
        <Field label="To"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={input} /></Field>
        <button type="button" onClick={() => fetchRange(from, to)} disabled={isPending} style={primaryBtn}>
          {isPending ? "Loading…" : "Load"}
        </button>
        <button
          type="button"
          onClick={() => downloadCsv(`geodetic-${from}_to_${to}-all.csv`, eventsToCsv(visibleAll))}
          disabled={!visibleAll.length}
          style={ghostBtn}
        >
          <Download size={12} style={{ marginRight: 6 }} /> All as CSV
        </button>
      </div>

      <FilterGroupHeader
        label="Bodies"
        onAll={() => setBodyFilter(new Set(allBodies))}
        onNone={() => setBodyFilter(new Set())}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "var(--space-lg)" }}>
        {allBodies.map((b) => (
          <label key={b} style={chip(bodyFilter.has(b))}>
            <input
              type="checkbox"
              checked={bodyFilter.has(b)}
              onChange={() => toggleBody(b)}
              style={{ display: "none" }}
            />
            {b}
          </label>
        ))}
      </div>

      <FilterGroupHeader label="Event types" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "var(--space-lg)", alignItems: "center" }}>
        {TYPE_GROUPS.map((g) => (
          <label key={g.key} style={chip(enabled[g.key])}>
            <input
              type="checkbox"
              checked={enabled[g.key]}
              onChange={(e) => setEnabled((prev) => ({ ...prev, [g.key]: e.target.checked }))}
              style={{ display: "none" }}
            />
            {g.label}
          </label>
        ))}
        <span style={{ width: 1, height: 16, background: "var(--border-subtle)", margin: "0 4px" }} />
        <label style={chip(anareticOnly)}>
          <input
            type="checkbox"
            checked={anareticOnly}
            onChange={(e) => setAnareticOnly(e.target.checked)}
            style={{ display: "none" }}
          />
          Late degrees only (29°+)
        </label>
      </div>

      {TYPE_GROUPS.map((g) => (
        <EventTable
          key={g.key}
          title={g.label}
          events={grouped[g.key]}
          filenameSlug={`${g.slug}-${from}_to_${to}`}
        />
      ))}

      {!isPending && !visibleAll.length && (
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          No events in this range. Try widening the window or enabling more event types.
        </p>
      )}
    </DashboardLayout>
  );
}

function FilterGroupHeader({ label, onAll, onNone }: { label: string; onAll?: () => void; onNone?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      {onAll && (
        <button type="button" onClick={onAll} style={miniLinkBtn}>all</button>
      )}
      {onNone && (
        <button type="button" onClick={onNone} style={miniLinkBtn}>none</button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      {children}
    </label>
  );
}

const input: React.CSSProperties = {
  padding: "6px 10px", fontFamily: "var(--font-body)", fontSize: "0.85rem",
  border: "1px solid var(--border-subtle)", borderRadius: 4, background: "transparent", color: "var(--text-primary)",
};
const primaryBtn: React.CSSProperties = {
  padding: "7px 14px", fontFamily: "var(--font-body)", fontSize: "0.85rem",
  border: "1px solid var(--text-primary)", borderRadius: 4,
  background: "var(--text-primary)", color: "var(--bg-primary, #fff)", cursor: "pointer",
};
const ghostBtn: React.CSSProperties = {
  padding: "7px 14px", fontFamily: "var(--font-body)", fontSize: "0.85rem",
  border: "1px solid var(--border-subtle)", borderRadius: 4,
  background: "transparent", color: "var(--text-primary)", cursor: "pointer",
  display: "inline-flex", alignItems: "center",
};
const miniLinkBtn: React.CSSProperties = {
  padding: 0, border: "none", background: "transparent",
  fontFamily: "var(--font-body)", fontSize: "0.7rem",
  color: "var(--text-secondary)", textDecoration: "underline", cursor: "pointer",
};
const chip = (active: boolean): React.CSSProperties => ({
  padding: "5px 12px", fontFamily: "var(--font-body)", fontSize: "0.78rem",
  border: `1px solid ${active ? "var(--text-primary)" : "var(--border-subtle)"}`,
  borderRadius: 999, cursor: "pointer",
  color: active ? "var(--text-primary)" : "var(--text-secondary)",
  background: active ? "var(--bg-subtle, transparent)" : "transparent",
});
