"use client";

/**
 * PredictionsTableClient — filterable table view of the global geodetic
 * predictions catalog from /api/geodetic-predictions. Styled per
 * .agents/skills/astro-design/SKILL.md (CSS-var fonts, asymmetric pill
 * filters, mono micro-labels, cut-shape tier badge).
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface PredictionRow {
    id: string;
    prediction_date: string;
    date_label: string | null;
    title: string;
    event_type: string;
    kind: "forecast" | "historical";
    pss: number;
    tier: "critical" | "high" | "moderate" | "watch" | "low";
    area_label: string | null;
    zones: string[];
    pair: string | null;
    geostress: string | null;
    severity: number | null;
    deaths: number | null;
    damage_billions: number | null;
    source: string | null;
}

interface ApiResponse {
    count: number;
    totalCatalogSize: number;
    rows: PredictionRow[];
}

type EventTypeFilter =
    | "all"
    | "flood"
    | "wildfire"
    | "storm_cyclone"
    | "earthquake"
    | "heatwave"
    | "tornado"
    | "winter_storm"
    | "compound";
type KindFilter = "all" | "forecast" | "historical";
type SortKey = "date_desc" | "date_asc" | "pss_desc" | "tier" | "type";

const TYPE_FILTERS: EventTypeFilter[] = [
    "all",
    "flood",
    "wildfire",
    "storm_cyclone",
    "heatwave",
    "tornado",
    "winter_storm",
    "earthquake",
    "compound",
];

const TYPE_LABELS: Record<EventTypeFilter, string> = {
    all: "All",
    flood: "Flood",
    wildfire: "Wildfire",
    storm_cyclone: "Storm / Cyclone",
    earthquake: "Seismic",
    heatwave: "Heatwave",
    tornado: "Tornado",
    winter_storm: "Winter Storm",
    compound: "Compound",
};

const TIER_ACCENT: Record<PredictionRow["tier"], string> = {
    critical: "var(--color-spiced-life)",
    high: "var(--gold)",
    moderate: "var(--color-acqua)",
    watch: "var(--sage)",
    low: "var(--text-tertiary)",
};

const TIER_BG: Record<PredictionRow["tier"], string> = {
    critical: "color-mix(in oklab, var(--color-spiced-life) 18%, transparent)",
    high: "color-mix(in oklab, var(--gold) 18%, transparent)",
    moderate: "color-mix(in oklab, var(--color-acqua) 18%, transparent)",
    watch: "color-mix(in oklab, var(--sage) 18%, transparent)",
    low: "color-mix(in oklab, var(--text-tertiary) 18%, transparent)",
};

function formatDate(isoDate: string): string {
    return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
}

function tierLabel(tier: PredictionRow["tier"]): string {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export default function PredictionsTableClient() {
    const router = useRouter();
    const [data, setData] = useState<ApiResponse | null>(null);
    // `loading` initial state is `true`; we never re-toggle it on remount.
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<EventTypeFilter>("all");
    const [kindFilter, setKindFilter] = useState<KindFilter>("all");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [sort, setSort] = useState<SortKey>("date_desc");

    useEffect(() => {
        const controller = new AbortController();
        fetch("/api/geodetic-predictions", { signal: controller.signal })
            .then(async (res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json() as Promise<ApiResponse>;
            })
            .then((json) => {
                setData(json);
                setError(null);
                setLoading(false);
            })
            .catch((err: Error) => {
                if (err.name === "AbortError") return;
                setError(err.message);
                setLoading(false);
            });
        return () => controller.abort();
    }, []);

    const filtered = useMemo(() => {
        if (!data) return [];
        let rows = data.rows;
        if (typeFilter !== "all") rows = rows.filter((r) => r.event_type === typeFilter);
        if (kindFilter !== "all") rows = rows.filter((r) => r.kind === kindFilter);
        if (fromDate) rows = rows.filter((r) => r.prediction_date >= fromDate);
        if (toDate) rows = rows.filter((r) => r.prediction_date <= toDate);

        const sorted = [...rows];
        switch (sort) {
            case "date_desc":
                sorted.sort((a, b) => b.prediction_date.localeCompare(a.prediction_date));
                break;
            case "date_asc":
                sorted.sort((a, b) => a.prediction_date.localeCompare(b.prediction_date));
                break;
            case "pss_desc":
                sorted.sort((a, b) => b.pss - a.pss);
                break;
            case "tier": {
                const order: Record<PredictionRow["tier"], number> = {
                    critical: 0, high: 1, moderate: 2, watch: 3, low: 4,
                };
                sorted.sort((a, b) => order[a.tier] - order[b.tier]);
                break;
            }
            case "type":
                sorted.sort((a, b) => a.event_type.localeCompare(b.event_type));
                break;
        }
        return sorted;
    }, [data, typeFilter, kindFilter, fromDate, toDate, sort]);

    return (
        <div className="predictions-table-shell">
            <Toolbar
                typeFilter={typeFilter}
                kindFilter={kindFilter}
                fromDate={fromDate}
                toDate={toDate}
                sort={sort}
                count={filtered.length}
                total={data?.totalCatalogSize ?? 0}
                onType={setTypeFilter}
                onKind={setKindFilter}
                onFrom={setFromDate}
                onTo={setToDate}
                onSort={setSort}
            />

            <div className="predictions-table-container">
                {loading ? (
                    <Empty label="Loading predictions catalog…" />
                ) : error ? (
                    <Empty label={`Failed to load: ${error}`} />
                ) : filtered.length === 0 ? (
                    <Empty label="No predictions match these filters" />
                ) : (
                    <table className="predictions-table">
                        <thead>
                            <tr>
                                <Th>Date</Th>
                                <Th>Title</Th>
                                <Th>Type</Th>
                                <Th>Kind</Th>
                                <Th>Area</Th>
                                <Th align="right">PSS</Th>
                                <Th>Tier</Th>
                                <Th>Source</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row) => (
                                <PredictionRowView
                                    key={row.id}
                                    row={row}
                                    onClick={() => router.push(`/weather/${row.id}`)}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style jsx>{`
                .predictions-table-shell {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 100%;
                    min-height: 0;
                    gap: var(--space-md);
                }
                .predictions-table-container {
                    flex: 1;
                    min-height: 0;
                    overflow: auto;
                    border: 1px solid var(--surface-border);
                    background: var(--surface);
                }
                .predictions-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-family: var(--font-body);
                    font-size: 0.85rem;
                }
                .predictions-table thead th {
                    position: sticky;
                    top: 0;
                    background: var(--bg);
                    z-index: 2;
                    text-align: left;
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid var(--surface-border);
                    font-family: var(--font-mono);
                    font-size: 0.6rem;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: var(--text-tertiary);
                    font-weight: 700;
                }
                .predictions-table tbody tr {
                    cursor: pointer;
                    border-bottom: 1px solid var(--surface-border);
                    transition: background 0.12s ease;
                }
                .predictions-table tbody tr:hover {
                    background: var(--bg-raised);
                }
                .predictions-table td {
                    padding: 0.75rem 1rem;
                    vertical-align: middle;
                }
            `}</style>
        </div>
    );
}

function Toolbar({
    typeFilter, kindFilter, fromDate, toDate, sort, count, total,
    onType, onKind, onFrom, onTo, onSort,
}: {
    typeFilter: EventTypeFilter;
    kindFilter: KindFilter;
    fromDate: string;
    toDate: string;
    sort: SortKey;
    count: number;
    total: number;
    onType: (v: EventTypeFilter) => void;
    onKind: (v: KindFilter) => void;
    onFrom: (v: string) => void;
    onTo: (v: string) => void;
    onSort: (v: SortKey) => void;
}) {
    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "var(--space-md)",
                padding: "var(--space-sm) 0",
                borderBottom: "1px solid var(--surface-border)",
            }}
        >
            {/* Kind */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Label>Kind</Label>
                {(["all", "forecast", "historical"] as KindFilter[]).map((k) => (
                    <Pill key={k} active={kindFilter === k} onClick={() => onKind(k)}>
                        {k === "all" ? "All" : k.charAt(0).toUpperCase() + k.slice(1)}
                    </Pill>
                ))}
            </div>

            {/* Type */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <Label>Type</Label>
                {TYPE_FILTERS.map((t) => (
                    <Pill key={t} active={typeFilter === t} onClick={() => onType(t)}>
                        {TYPE_LABELS[t]}
                    </Pill>
                ))}
            </div>

            {/* Date range */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Label>From</Label>
                <DateInput value={fromDate} onChange={onFrom} />
                <Label>To</Label>
                <DateInput value={toDate} onChange={onTo} />
            </div>

            {/* Sort */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Label>Sort</Label>
                <select
                    value={sort}
                    onChange={(e) => onSort(e.target.value as SortKey)}
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.65rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        background: "var(--bg)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--surface-border)",
                        padding: "0.3rem 0.6rem",
                        borderRadius: 0,
                        cursor: "pointer",
                    }}
                >
                    <option value="date_desc">Date ↓</option>
                    <option value="date_asc">Date ↑</option>
                    <option value="pss_desc">PSS ↓</option>
                    <option value="tier">Tier</option>
                    <option value="type">Type</option>
                </select>
            </div>

            {/* Count */}
            <span
                style={{
                    marginLeft: "auto",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.65rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-tertiary)",
                }}
            >
                {count} of {total}
            </span>
        </div>
    );
}

function PredictionRowView({ row, onClick }: { row: PredictionRow; onClick: () => void }) {
    return (
        <tr onClick={onClick}>
            <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", whiteSpace: "nowrap", color: "var(--text-secondary)" }}>
                {row.date_label ?? formatDate(row.prediction_date)}
            </td>
            <td style={{ fontFamily: "var(--font-secondary)", fontSize: "0.95rem", color: "var(--text-primary)", maxWidth: 320 }}>
                {row.title}
                {row.pair ? (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-tertiary)", marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        {row.pair}
                    </div>
                ) : null}
            </td>
            <td>
                <span
                    style={{
                        display: "inline-block",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        padding: "0.25rem 0.6rem",
                        border: "1px solid var(--surface-border)",
                        borderRadius: 20,
                        color: "var(--text-secondary)",
                    }}
                >
                    {TYPE_LABELS[row.event_type as EventTypeFilter] ?? row.event_type}
                </span>
            </td>
            <td>
                <span
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: row.kind === "forecast" ? "var(--color-y2k-blue)" : "var(--text-tertiary)",
                    }}
                >
                    {row.kind}
                </span>
            </td>
            <td style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--text-secondary)", maxWidth: 240 }}>
                {row.area_label ?? "—"}
            </td>
            <td style={{ textAlign: "right" }}>
                <PssBar value={row.pss} />
            </td>
            <td>
                <span
                    style={{
                        display: "inline-block",
                        clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
                        background: TIER_BG[row.tier],
                        color: TIER_ACCENT[row.tier],
                        padding: "0.3rem 0.85rem",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    {tierLabel(row.tier)}
                </span>
            </td>
            <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.source ?? "—"}
            </td>
        </tr>
    );
}

function Label({ children }: { children: React.ReactNode }) {
    return (
        <span
            style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.55rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                marginRight: 4,
            }}
        >
            {children}
        </span>
    );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: active ? "var(--color-y2k-blue)" : "transparent",
                color: active ? "white" : "var(--text-secondary)",
                border: `1px solid ${active ? "var(--color-y2k-blue)" : "var(--surface-border)"}`,
                borderRadius: 20,
                padding: "0.3rem 0.75rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background 0.12s ease, color 0.12s ease, border 0.12s ease",
            }}
        >
            {children}
        </button>
    );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                background: "var(--bg)",
                color: "var(--text-primary)",
                border: "1px solid var(--surface-border)",
                padding: "0.25rem 0.5rem",
                borderRadius: 0,
            }}
        />
    );
}

function PssBar({ value }: { value: number }) {
    const pct = Math.max(0, Math.min(1, value));
    const color =
        value >= 0.7 ? "var(--color-spiced-life)" :
        value >= 0.55 ? "var(--gold)" :
        value >= 0.4 ? "var(--color-acqua)" :
        "var(--sage)";
    return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 100 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-primary)", minWidth: 36, textAlign: "right" }}>
                {value.toFixed(2)}
            </span>
            <div style={{ flex: 1, height: 4, background: "var(--surface-border)", position: "relative", minWidth: 60 }}>
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${pct * 100}%`,
                        background: color,
                    }}
                />
            </div>
        </div>
    );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
    return <th style={{ textAlign: align }}>{children}</th>;
}

function Empty({ label }: { label: string }) {
    return (
        <div
            style={{
                padding: "var(--space-xl)",
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
            }}
        >
            {label}
        </div>
    );
}
