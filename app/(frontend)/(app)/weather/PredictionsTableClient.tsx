"use client";

/**
 * PredictionsTableClient — filterable table view of the global geodetic
 * predictions catalog from /api/geodetic-predictions. Styled per
 * .agents/skills/astro-design/SKILL.md (CSS-var fonts, asymmetric pill
 * filters, mono micro-labels, cut-shape tier badge).
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/app/components/ui/table";

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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number] | "all";

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
    const [pageSize, setPageSize] = useState<PageSize>(10);
    const [currentPage, setCurrentPage] = useState(1);

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

    // Reset to page 1 when the filter set or page size changes — otherwise
    // a filter change could leave the user on page 4 of a 2-page result.
    // Done via the React-recommended "derive state from props during render"
    // pattern (https://react.dev/reference/react/useState#storing-information-from-previous-renders).
    const filterKey = `${typeFilter}|${kindFilter}|${fromDate}|${toDate}|${sort}|${pageSize}`;
    const [lastFilterKey, setLastFilterKey] = useState(filterKey);
    if (filterKey !== lastFilterKey) {
        setLastFilterKey(filterKey);
        setCurrentPage(1);
    }

    const totalPages = pageSize === "all"
        ? 1
        : Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const pageStart = pageSize === "all" ? 0 : (safePage - 1) * pageSize;
    const pageEnd = pageSize === "all" ? filtered.length : pageStart + pageSize;
    const pageRows = filtered.slice(pageStart, pageEnd);
    const rangeStart = filtered.length === 0 ? 0 : pageStart + 1;
    const rangeEnd = Math.min(pageEnd, filtered.length);

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
                    <Table>
                        <TableHeader className="bg-[var(--bg)] sticky top-0 z-[2]">
                            <TableRow className="border-[color:var(--surface-border)]">
                                <TableHead className="font-mono text-[var(--text-tertiary)]">Date</TableHead>
                                <TableHead className="font-mono text-[var(--text-tertiary)]">Title</TableHead>
                                <TableHead className="font-mono text-[var(--text-tertiary)]">Type</TableHead>
                                <TableHead className="font-mono text-[var(--text-tertiary)]">Kind</TableHead>
                                <TableHead className="font-mono text-[var(--text-tertiary)]">Area</TableHead>
                                <TableHead className="font-mono text-[var(--text-tertiary)] text-right pr-6">PSS</TableHead>
                                <TableHead className="font-mono text-[var(--text-tertiary)]">Tier</TableHead>
                                <TableHead className="font-mono text-[var(--text-tertiary)]">Source</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pageRows.map((row, idx) => (
                                <PredictionRowView
                                    key={row.id}
                                    row={row}
                                    striped={idx % 2 === 1}
                                    onClick={() => router.push(`/weather/${row.id}`)}
                                />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {!loading && !error && filtered.length > 0 ? (
                <Pagination
                    rangeStart={rangeStart}
                    rangeEnd={rangeEnd}
                    total={filtered.length}
                    page={safePage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    onPageSize={(n) => setPageSize(n)}
                    onPage={(n) => setCurrentPage(n)}
                />
            ) : null}

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
            `}</style>
        </div>
    );
}

// ─── Pagination ──────────────────────────────────────────────────────────

function Pagination({
    rangeStart, rangeEnd, total, page, totalPages, pageSize,
    onPage, onPageSize,
}: {
    rangeStart: number;
    rangeEnd: number;
    total: number;
    page: number;
    totalPages: number;
    pageSize: PageSize;
    onPage: (n: number) => void;
    onPageSize: (n: PageSize) => void;
}) {
    const canPrev = page > 1;
    const canNext = page < totalPages;

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.85rem 1rem 0",
                borderTop: "1px solid var(--surface-border)",
                marginTop: "0.5rem",
                flexWrap: "wrap",
            }}
        >
            <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
            }}>
                Showing <b style={{ color: "var(--text-secondary)" }}>{rangeStart}–{rangeEnd}</b> of <b style={{ color: "var(--text-secondary)" }}>{total}</b>
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                {/* Page size selector */}
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--text-tertiary)",
                    }}>Rows</span>
                    <select
                        value={pageSize === "all" ? "all" : String(pageSize)}
                        onChange={(e) => {
                            const v = e.target.value;
                            onPageSize(v === "all" ? "all" : (Number(v) as PageSize));
                        }}
                        style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.65rem",
                            background: "var(--bg)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--surface-border)",
                            padding: "0.3rem 0.5rem",
                            borderRadius: 0,
                            cursor: "pointer",
                        }}
                    >
                        {PAGE_SIZE_OPTIONS.map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                        <option value="all">All</option>
                    </select>
                </label>

                {/* Page indicator */}
                <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.65rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-secondary)",
                    minWidth: 80,
                    textAlign: "center",
                }}>
                    Page <b style={{ color: "var(--text-primary)" }}>{page}</b> of <b style={{ color: "var(--text-primary)" }}>{totalPages}</b>
                </span>

                {/* Navigation buttons */}
                <div style={{ display: "inline-flex", gap: 2 }}>
                    <PageBtn onClick={() => onPage(1)} disabled={!canPrev} ariaLabel="First page"><ChevronsLeft size={14} /></PageBtn>
                    <PageBtn onClick={() => onPage(page - 1)} disabled={!canPrev} ariaLabel="Previous page"><ChevronLeft size={14} /></PageBtn>
                    <PageBtn onClick={() => onPage(page + 1)} disabled={!canNext} ariaLabel="Next page"><ChevronRight size={14} /></PageBtn>
                    <PageBtn onClick={() => onPage(totalPages)} disabled={!canNext} ariaLabel="Last page"><ChevronsRight size={14} /></PageBtn>
                </div>
            </div>
        </div>
    );
}

function PageBtn({
    onClick, disabled, ariaLabel, children,
}: {
    onClick: () => void;
    disabled: boolean;
    ariaLabel: string;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            style={{
                width: 30,
                height: 30,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: disabled ? "transparent" : "var(--surface)",
                color: disabled ? "var(--text-tertiary)" : "var(--text-primary)",
                border: "1px solid var(--surface-border)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
                transition: "background 0.12s ease, opacity 0.12s ease",
                padding: 0,
            }}
        >
            {children}
        </button>
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

function PredictionRowView({
    row, striped, onClick,
}: { row: PredictionRow; striped: boolean; onClick: () => void }) {
    // Zebra striping carried via inline style so we don't fight shadcn's
    // hover:bg-muted/50 class. Hover wins over the zebra tint.
    const baseBg = striped ? "color-mix(in oklab, var(--text-primary) 2%, transparent)" : "transparent";
    return (
        <TableRow
            onClick={onClick}
            className="cursor-pointer border-[color:var(--surface-border)]"
            style={{ background: baseBg }}
        >
            <TableCell className="font-mono text-[0.72rem] whitespace-nowrap text-[var(--text-secondary)] py-4">
                {row.date_label ?? formatDate(row.prediction_date)}
            </TableCell>

            <TableCell className="py-4" style={{ maxWidth: 360 }}>
                <div className="font-[family-name:var(--font-secondary)] text-[0.98rem] text-[var(--text-primary)] leading-tight">
                    {row.title}
                </div>
                {row.pair ? (
                    <div className="font-mono text-[0.58rem] text-[var(--text-tertiary)] mt-1 tracking-[0.06em] uppercase">
                        {row.pair}
                    </div>
                ) : null}
            </TableCell>

            <TableCell className="py-4">
                <span className="inline-block font-mono text-[0.6rem] tracking-[0.1em] uppercase px-2.5 py-1 border border-[color:var(--surface-border)] rounded-full text-[var(--text-secondary)] whitespace-nowrap">
                    {TYPE_LABELS[row.event_type as EventTypeFilter] ?? row.event_type}
                </span>
            </TableCell>

            <TableCell className="py-4">
                <span
                    className="font-mono text-[0.6rem] tracking-[0.1em] uppercase whitespace-nowrap"
                    style={{ color: row.kind === "forecast" ? "var(--color-y2k-blue)" : "var(--text-tertiary)" }}
                >
                    {row.kind}
                </span>
            </TableCell>

            <TableCell className="font-[family-name:var(--font-body)] text-[0.82rem] text-[var(--text-secondary)] py-4" style={{ maxWidth: 240 }}>
                {row.area_label ?? "—"}
            </TableCell>

            <TableCell className="text-right pr-6 py-4">
                <PssBar value={row.pss} />
            </TableCell>

            <TableCell className="py-4">
                <span
                    className="inline-block font-mono text-[0.6rem] tracking-[0.12em] uppercase font-bold whitespace-nowrap"
                    style={{
                        clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
                        background: TIER_BG[row.tier],
                        color: TIER_ACCENT[row.tier],
                        padding: "0.32rem 0.9rem",
                    }}
                >
                    {tierLabel(row.tier)}
                </span>
            </TableCell>

            <TableCell className="font-mono text-[0.6rem] text-[var(--text-tertiary)] py-4" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.source ?? "—"}
            </TableCell>
        </TableRow>
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
