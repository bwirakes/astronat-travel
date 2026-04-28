"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Download, Search } from "lucide-react";
import { PageHeader } from "@/components/app/page-header-context";
import type { EventType, PatternEvent } from "@/lib/astro/geodetic-patterns";
import { BODIES, GEN_END_YEAR, GEN_START_YEAR, SIGNS } from "@/lib/astro/geodetic-patterns";
import { COUNTRY_CHARTS } from "@/lib/astro/mundane-charts";
import { loadEventsRange } from "./actions";
import { UnifiedTable } from "./UnifiedTable";
import { FilterDropdown } from "./FilterDropdown";
import { CATEGORIES, CATEGORY_OF, type Category } from "./categories";
import { downloadCsv, eventsToCsv } from "./csv";

const ALL_TYPES: EventType[] = Object.keys(CATEGORY_OF) as EventType[];
const ALL_CATEGORIES: Category[] = CATEGORIES.map((c) => c.key);

export default function GeodeticPatternsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(`${new Date().getUTCFullYear()}-01-01`);
  const [to, setTo] = useState(today);

  const allBodies = useMemo(() => Object.keys(BODIES), []);
  const allCities = useMemo(() => COUNTRY_CHARTS.map((c) => c.capital.city), []);
  const [bodyFilter, setBodyFilter] = useState<Set<string>>(new Set(allBodies));
  const [signFilter, setSignFilter] = useState<Set<string>>(new Set(SIGNS));
  const [cityFilter, setCityFilter] = useState<Set<string>>(new Set(allCities));
  const [catFilter, setCatFilter] = useState<Set<Category>>(new Set(ALL_CATEGORIES));
  const [anareticOnly, setAnareticOnly] = useState(false);
  const [query, setQuery] = useState("");

  const [events, setEvents] = useState<PatternEvent[]>([]);
  const [isPending, startTransition] = useTransition();

  const fetchRange = (f: string, t: string) => {
    startTransition(async () => {
      const result = await loadEventsRange(`${f}T00:00:00Z`, `${t}T23:59:59Z`);
      setEvents(result);
    });
  };
  useEffect(() => { fetchRange(from, to); /* eslint-disable-next-line */ }, []);

  const toggleCat = (c: Category) => setCatFilter((prev) => {
    const next = new Set(prev);
    if (next.has(c)) next.delete(c); else next.add(c);
    return next;
  });

  const bodyMatches = (e: PatternEvent) => {
    if (bodyFilter.size === allBodies.length) return true;
    const parts = e.body.split(/[-/+,]/).map((s) => s.trim());
    return parts.some((p) => bodyFilter.has(p));
  };
  const signMatches = (e: PatternEvent) => {
    if (signFilter.size === SIGNS.length) return true;
    const signsOnEvent = [e.sign, e.fromSign, e.toSign].filter(Boolean) as string[];
    if (!signsOnEvent.length) return true;
    return signsOnEvent.some((s) => signFilter.has(s));
  };
  const queryMatches = (e: PatternEvent) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const hay = [
      e.type, e.body, e.sign, e.fromSign, e.toSign, e.geodeticZone,
      e.meta?.aspect, e.meta?.body1, e.meta?.body2, e.meta?.axis,
      e.meta?.members, e.meta?.eclipseType, e.meta?.hemisphere,
    ].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  };
  // City filter only narrows sun-over-mc events; other types ignore it.
  const cityMatches = (e: PatternEvent) =>
    e.type !== "sun-over-mc" || cityFilter.has(String(e.meta?.city ?? ""));
  const passes = (e: PatternEvent) =>
    catFilter.has(CATEGORY_OF[e.type]) &&
    bodyMatches(e) && signMatches(e) && cityMatches(e) && queryMatches(e) &&
    (!anareticOnly || e.meta?.anaretic === true);

  const visible = useMemo(
    () => events.filter(passes),
    [events, catFilter, bodyFilter, signFilter, cityFilter, anareticOnly, query]
  );

  return (
    <>
      <PageHeader title="Geodetic Patterns" />
      <div style={{ ...lightScope, padding: "var(--space-lg) var(--space-md) var(--space-3xl)", width: "100%" }}>
        <p style={intro}>
          22-technique research framework for mapping world events to planetary lines.
          Filter by category, body, or sign — or search — to build a protocol. Data: {GEN_START_YEAR}–{GEN_END_YEAR}.
        </p>

        <div style={row}>
          <Field label="From"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={input} /></Field>
          <Field label="To"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={input} /></Field>
          <button type="button" onClick={() => fetchRange(from, to)} disabled={isPending} style={primaryBtn}>
            {isPending ? "Loading…" : "Load"}
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(`geodetic-${from}_to_${to}.csv`, eventsToCsv(visible))}
            disabled={!visible.length}
            style={ghostBtn}
          >
            <Download size={12} style={{ marginRight: 6 }} /> CSV
          </button>
        </div>

        <div style={chipRow}>
          <button
            type="button"
            style={pillChip(catFilter.size === ALL_CATEGORIES.length)}
            onClick={() => setCatFilter(new Set(ALL_CATEGORIES))}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              style={pillChip(catFilter.has(c.key))}
              onClick={() => toggleCat(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ ...row, marginBottom: 12 }}>
          <div style={{ position: "relative", flex: "1 1 280px", minWidth: 240, maxWidth: 400 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#999" }} />
            <input
              type="text"
              placeholder="Search event, body, sign, aspect…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ ...input, width: "100%", paddingLeft: 30 }}
            />
          </div>
          <FilterDropdown label="Bodies" options={allBodies} selected={bodyFilter} onChange={setBodyFilter} />
          <FilterDropdown label="Signs" options={SIGNS} selected={signFilter} onChange={setSignFilter} />
          <FilterDropdown label="Cities (Sun/MC)" options={allCities} selected={cityFilter} onChange={setCityFilter} />
          <label style={toggleChip(anareticOnly)}>
            <input
              type="checkbox"
              checked={anareticOnly}
              onChange={(e) => setAnareticOnly(e.target.checked)}
              style={{ display: "none" }}
            />
            29°+ only
          </label>
          <button
            type="button"
            onClick={() => {
              setBodyFilter(new Set(["Uranus"]));
              setSignFilter(new Set(["Taurus"]));
              setAnareticOnly(true);
              setCatFilter(new Set(ALL_CATEGORIES));
              setQuery("");
            }}
            style={spotlightBtn}
            title="Preset: Uranus late-Taurus transits"
          >
            ⚡ Uranus · late Taurus
          </button>
          <span style={countStyle}>{visible.length.toLocaleString()} events</span>
        </div>

        <UnifiedTable events={visible} />
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

const lightScope: React.CSSProperties = {
  background: "#f9f8f5", color: "#1a1a18",
  padding: "1.5rem", borderRadius: 8,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: 14, lineHeight: 1.5,
};
const intro: React.CSSProperties = {
  fontSize: 13, color: "#6b6b66", maxWidth: 640, marginBottom: "1.2rem",
};
const row: React.CSSProperties = {
  display: "flex", flexWrap: "wrap", gap: 10, alignItems: "end", marginBottom: "1rem",
};
const chipRow: React.CSSProperties = {
  display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "0.8rem",
};
const fieldLabel: React.CSSProperties = {
  fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600,
};
const input: React.CSSProperties = {
  padding: "6px 10px", fontSize: 12, fontFamily: "inherit",
  border: "1px solid #d5d5d0", borderRadius: 6,
  background: "#fff", color: "#1a1a18",
};
const primaryBtn: React.CSSProperties = {
  padding: "7px 14px", fontSize: 12, fontFamily: "inherit",
  border: "1px solid #1a1a18", borderRadius: 6,
  background: "#1a1a18", color: "#fff", cursor: "pointer",
};
const ghostBtn: React.CSSProperties = {
  padding: "7px 12px", fontSize: 12, fontFamily: "inherit",
  border: "1px solid #d5d5d0", borderRadius: 6,
  background: "#fff", color: "#1a1a18", cursor: "pointer",
  display: "inline-flex", alignItems: "center",
};
const pillChip = (active: boolean): React.CSSProperties => ({
  fontSize: 12, padding: "4px 14px", borderRadius: 20,
  border: "1px solid #d5d5d0",
  background: active ? "#1a1a18" : "#fff",
  color: active ? "#fff" : "#6b6b66",
  cursor: "pointer", transition: "all 0.15s",
  fontFamily: "inherit",
});
const toggleChip = (active: boolean): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center",
  padding: "6px 12px", fontSize: 12, fontFamily: "inherit",
  border: `1px solid ${active ? "#1a1a18" : "#d5d5d0"}`, borderRadius: 6,
  background: active ? "#1a1a18" : "#fff",
  color: active ? "#fff" : "#6b6b66",
  cursor: "pointer",
});
const spotlightBtn: React.CSSProperties = {
  padding: "6px 12px", fontSize: 12, fontFamily: "inherit",
  border: "1px solid #d5d5d0", borderRadius: 6,
  background: "#fff", color: "#6b6b66", cursor: "pointer",
};
const countStyle: React.CSSProperties = {
  marginLeft: "auto", fontSize: 11, color: "#999",
  alignSelf: "center", fontVariantNumeric: "tabular-nums",
};
