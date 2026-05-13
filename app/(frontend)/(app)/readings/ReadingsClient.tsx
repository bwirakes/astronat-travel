"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import posthog from "posthog-js";
import { ArrowRight, ChevronLeft, ChevronRight, Map as MapIcon, List as ListIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScoreRing, getVerdict, BAND_CONFIG } from "@/app/components/ScoreRing";
import type { AtlasPin } from "@/app/components/ReadingsAtlasMap";
import { PageHeader } from "@/components/app/page-header-context";
import { PAGE_SIZE } from "./constants";

// Re-export so existing call sites that previously imported PAGE_SIZE from
// this module keep working. New imports should use ./constants directly.
export { PAGE_SIZE };

const ReadingsAtlasMap = dynamic(
  () => import("@/app/components/ReadingsAtlasMap").then((m) => ({ default: m.ReadingsAtlasMap })),
  { ssr: false, loading: () => <SkeletonBox label="Loading map..." /> }
);

export type SortKey = "recent" | "score" | "travel" | "alpha";
export type TypeFilter = "all" | "trip" | "relocation" | "couples";

export type Reading = {
  id: string;
  destination: string;
  lat: number | null;
  lon: number | null;
  score: number;
  travelDate: string;
  travelType: string;
  typeFilter: Exclude<TypeFilter, "all">;
};

export type SupabaseReadingRow = {
  id: string;
  details?: {
    destination?: string;
    destinationLat?: number;
    destinationLon?: number;
    travelType?: string;
    macroScore?: number;
  } | null;
  category?: string | null;
  reading_date: string;
  reading_score?: number | null;
};

const SORT_LABELS: Record<SortKey, string> = {
  recent: "Recent",
  score: "Score",
  travel: "Travel date",
  alpha: "A to Z",
};

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: "All",
  trip: "Trip",
  relocation: "Relocation",
  couples: "Couples",
};

interface Props {
  readings: Reading[];
  total: number;
  page: number;
  sort: SortKey;
  typeFilter: TypeFilter;
}

export function toReading(row: SupabaseReadingRow): Reading {
  const isCouples = row.category === "synastry";
  const travelType = row.details?.travelType || row.category || "trip";
  const typeFilter: Exclude<TypeFilter, "all"> = isCouples
    ? "couples"
    : travelType === "relocation"
      ? "relocation"
      : "trip";

  return {
    id: row.id,
    destination: row.details?.destination || "Unknown Destination",
    lat: typeof row.details?.destinationLat === "number" ? row.details.destinationLat : null,
    lon: typeof row.details?.destinationLon === "number" ? row.details.destinationLon : null,
    travelType: isCouples ? "couples" : travelType,
    typeFilter,
    travelDate: row.reading_date,
    score: row.reading_score || row.details?.macroScore || 50,
  };
}

export function filterAndSortReadings(readings: Reading[], sort: SortKey, typeFilter: TypeFilter): Reading[] {
  const byType = readings.filter((reading) => {
    if (typeFilter === "all") return true;
    return reading.typeFilter === typeFilter;
  });

  return [...byType].sort((a, b) => {
    switch (sort) {
      case "score":
        return b.score - a.score;
      case "travel":
        return new Date(b.travelDate).getTime() - new Date(a.travelDate).getTime();
      case "alpha":
        return a.destination.localeCompare(b.destination);
      case "recent":
      default:
        return readings.indexOf(a) - readings.indexOf(b);
    }
  });
}

export function ReadingsClient({ readings, total, page, sort, typeFilter }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"list" | "map">("list");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;

  const updateParam = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    });
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };

  const pinsForMap: AtlasPin[] = readings
    .filter((r): r is Reading & { lat: number; lon: number } => r.lat !== null && r.lon !== null)
    .map((r) => ({
      id: r.id,
      destination: r.destination,
      lat: r.lat,
      lon: r.lon,
      score: r.score,
      travelDate: r.travelDate,
      travelType: r.travelType,
    }));

  const goReading = (id: string) => router.push(`/reading/${id}`);

  return (
    <>
      <PageHeader title="Your Readings" />
      <div className="readings-shell">
        <ControlsBar
          sort={sort}
          typeFilter={typeFilter}
          onSort={(s) => updateParam({ sort: s === "recent" ? null : s, page: null })}
          onType={(t) => updateParam({ type: t === "all" ? null : t, page: null })}
          onNew={() => {
            posthog.capture("new_reading_started", { source: "readings_page" });
            router.push("/reading/new");
          }}
        />

        <div className="readings-mobile-tabs">
          {(["list", "map"] as const).map((t) => {
            const active = mobileTab === t;
            return (
              <button
                key={t}
                onClick={() => setMobileTab(t)}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "0.5rem 0.75rem",
                  border: "none",
                  borderRadius: "var(--radius-full)",
                  background: active ? "var(--bg-raised)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {t === "list" ? <ListIcon size={14} /> : <MapIcon size={14} />}
                {t}
              </button>
            );
          })}
        </div>

        <div className="readings-split">
          <div className="readings-map-col">
            {pinsForMap.length === 0 ? (
              <EmptyMap />
            ) : (
              <ReadingsAtlasMap
                pins={pinsForMap}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onSelect={goReading}
                showCounter={{ shown: readings.length, total }}
              />
            )}
          </div>

          <div className="readings-list-col">
            {total === 0 ? (
              <EmptyList
                hasFilters={typeFilter !== "all"}
                onClear={() => updateParam({ type: null, sort: null, page: null })}
                onNew={() => router.push("/reading/new")}
              />
            ) : (
              <>
                <div className="readings-list-scroll">
                  {readings.map((r, i) => (
                    <ReadingRow
                      key={r.id}
                      reading={r}
                      index={i}
                      isHighlighted={hoveredId === r.id}
                      onHover={setHoveredId}
                      onSelect={() => goReading(r.id)}
                    />
                  ))}
                </div>

                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  totalCount={total}
                  pageStart={pageStart}
                  showingCount={readings.length}
                  onPage={(p) => {
                    updateParam({ page: p === 1 ? null : String(p) });
                    setHoveredId(null);
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <button
        className="dashboard-fab readings-fab"
        onClick={() => {
          posthog.capture("new_reading_started", { source: "fab" });
          router.push("/reading/new");
        }}
      >
        + New Reading
      </button>

      <style jsx>{`
        .readings-shell {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: var(--space-md) var(--space-md) var(--space-md);
          height: calc(100dvh - var(--page-header-height, 64px));
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .readings-mobile-tabs {
          display: none;
          margin: var(--space-sm) 0;
          gap: 4px;
          border: 1px solid var(--surface-border);
          border-radius: var(--radius-full);
          padding: 3px;
          background: var(--surface);
        }
        .readings-split {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
          gap: var(--space-lg);
          margin-top: var(--space-md);
        }
        .readings-map-col {
          min-height: 0;
          height: 100%;
        }
        .readings-list-col {
          min-height: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--surface-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--surface);
        }
        .readings-list-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .readings-list-scroll::-webkit-scrollbar { width: 8px; }
        .readings-list-scroll::-webkit-scrollbar-thumb {
          background: var(--surface-border);
          border-radius: 4px;
        }
        .readings-list-scroll::-webkit-scrollbar-track { background: transparent; }

        @media (max-width: 1023px) {
          .readings-shell {
            height: auto;
            min-height: calc(100dvh - var(--page-header-height, 64px));
            padding-bottom: calc(var(--space-2xl) + env(safe-area-inset-bottom));
          }
          .readings-mobile-tabs { display: flex; }
          .readings-split {
            grid-template-columns: 1fr;
            gap: var(--space-md);
            min-height: 60vh;
          }
          .readings-map-col {
            display: ${mobileTab === "map" ? "block" : "none"};
            height: 60vh;
          }
          .readings-list-col {
            display: ${mobileTab === "list" ? "flex" : "none"};
            height: auto;
            min-height: 60vh;
          }
        }

        @media (max-width: 767px) {
          .readings-shell {
            padding: var(--space-sm) var(--space-md) calc(var(--space-2xl) + env(safe-area-inset-bottom));
          }

          .readings-split {
            flex: 0 0 auto;
            min-height: 0;
          }

          .readings-list-col {
            min-height: 0;
          }

          .readings-fab {
            display: none;
          }
        }
      `}</style>
      <style jsx global>{`
        .readings-controls {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--space-md);
          padding: var(--space-sm) 0;
          border-bottom: 1px solid var(--surface-border);
          flex-shrink: 0;
        }

        .readings-filter-cluster {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--space-md);
          min-width: 0;
          width: 100%;
        }

        .readings-control-group {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .readings-control-label {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-tertiary);
        }

        .readings-actions-group {
          margin-left: auto;
          display: flex;
          align-items: center;
        }

        .readings-new-button {
          padding: 0.4rem 0.9rem;
          font-size: 0.75rem;
        }

        .readings-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
          padding: var(--space-sm) var(--space-md);
          border-top: 1px solid var(--surface-border);
          background: var(--surface);
          flex-shrink: 0;
        }

        .readings-pagination-label {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-tertiary);
        }

        .readings-pagination-pages {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .readings-pagination-btn {
          min-width: 30px;
          height: 30px;
          padding: 0 0.55rem;
          border: 1px solid var(--surface-border);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.7rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .readings-pagination-ellipsis {
          color: var(--text-tertiary);
          padding: 0 4px;
          align-self: center;
        }

        @media (max-width: 767px) {
          .readings-controls {
            align-items: stretch;
            flex-direction: column;
            gap: 0.7rem;
            padding: 0.65rem 0 0.85rem;
          }

          .readings-actions-group {
            margin-left: 0;
            justify-content: flex-end;
            width: auto;
            align-self: end;
          }

          .readings-new-button {
            min-height: 38px;
            padding: 0.48rem 0.8rem !important;
            border-radius: var(--radius-full);
            flex-shrink: 0;
            white-space: nowrap;
          }

          .readings-filter-cluster {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
            align-items: end;
            gap: 0.6rem;
            width: 100%;
          }

          .readings-control-group {
            align-items: stretch;
            flex-direction: column;
            gap: 0.35rem;
          }

          .readings-sort-select,
          .readings-type-select {
            min-height: 38px;
            width: 100%;
          }

          .readings-pagination {
            padding: 0.65rem 0.85rem;
            background: color-mix(in oklab, var(--surface) 78%, var(--bg));
          }

          .readings-pagination-label {
            font-size: 0.62rem;
            color: var(--text-secondary);
          }

          .readings-pagination-number,
          .readings-pagination-ellipsis {
            display: none;
          }

          .readings-pagination-control {
            min-width: 42px;
            height: 36px;
            border-radius: var(--radius-full);
          }

          .reading-row {
            padding: var(--space-md) var(--space-sm) !important;
            align-items: flex-start !important;
            gap: var(--space-sm) !important;
          }

          .reading-row-main {
            gap: 0.45rem !important;
          }

          .reading-row-ring {
            width: 76px !important;
            height: 76px !important;
            flex: 0 0 76px !important;
            overflow: hidden !important;
            transform: none !important;
            margin-right: 0 !important;
          }

          .reading-row-ring > div {
            transform: scale(0.54);
            transform-origin: top left;
          }

          .reading-row-title {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            font-size: 0.92rem !important;
          }

          .reading-row-meta {
            line-height: 1.45 !important;
          }

          .reading-row-view {
            padding: 0.32rem 0.7rem !important;
          }
        }

        @media (max-width: 374px) {
          .readings-filter-cluster {
            grid-template-columns: minmax(0, 1fr) auto;
          }

          .readings-sort-group {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </>
  );
}

function ControlsBar({
  sort,
  typeFilter,
  onSort,
  onType,
  onNew,
}: {
  sort: SortKey;
  typeFilter: TypeFilter;
  onSort: (s: SortKey) => void;
  onType: (t: TypeFilter) => void;
  onNew: () => void;
}) {
  return (
    <div className="readings-controls">
      <div className="readings-filter-cluster">
        <div className="readings-control-group readings-sort-group">
          <Label>Sort</Label>
          <select className="readings-sort-select" value={sort} onChange={(e) => onSort(e.target.value as SortKey)} style={selectStyle}>
            {Object.entries(SORT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="readings-control-group readings-type-group">
          <Label>Type</Label>
          <select className="readings-type-select" value={typeFilter} onChange={(e) => onType(e.target.value as TypeFilter)} style={selectStyle}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="readings-actions-group">
          <button
            onClick={onNew}
            className="btn btn-primary readings-new-button"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            + New <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ReadingRow({
  reading,
  index,
  isHighlighted,
  onHover,
  onSelect,
}: {
  reading: Reading;
  index: number;
  isHighlighted: boolean;
  onHover: (id: string | null) => void;
  onSelect: () => void;
}) {
  const verdict = getVerdict(reading.score);
  const ringColor = BAND_CONFIG[verdict].ring;
  return (
    <motion.div
      className="reading-row"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onMouseEnter={() => onHover(reading.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onSelect}
      style={{
        position: "relative",
        background: isHighlighted ? "var(--bg-raised)" : "var(--surface)",
        borderBottom: "1px solid var(--surface-border)",
        padding: "var(--space-md) var(--space-lg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-md)",
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
    >
      {isHighlighted && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: ringColor,
          }}
        />
      )}
      <div className="reading-row-main" style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", minWidth: 0, flex: 1 }}>
        <div className="reading-row-ring" style={{ transform: "scale(0.55)", transformOrigin: "left center", marginRight: "-36px", flexShrink: 0 }}>
          <ScoreRing score={reading.score} verdict={verdict} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            className="reading-row-title"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "0.95rem",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {reading.destination}
          </div>
          <div
            className="reading-row-meta"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.58rem",
              color: "var(--text-tertiary)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginTop: "0.3rem",
            }}
          >
            {new Date(reading.travelDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {reading.travelType}
          </div>
        </div>
      </div>
      <button
        className="reading-row-view"
        style={{
          background: "transparent",
          border: "1px solid var(--surface-border)",
          color: "var(--text-primary)",
          borderRadius: "var(--radius-full)",
          padding: "0.3rem 0.85rem",
          fontSize: "0.7rem",
          fontFamily: "var(--font-body)",
          fontWeight: 500,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        View ›
      </button>
    </motion.div>
  );
}

function Pagination({
  page,
  totalPages,
  totalCount,
  pageStart,
  showingCount,
  onPage,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  pageStart: number;
  showingCount: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const firstShown = totalCount === 0 ? 0 : pageStart + 1;
  const lastShown = pageStart + showingCount;
  const pages: number[] = [];
  const pageWindow = 1;
  for (let p = Math.max(1, page - pageWindow); p <= Math.min(totalPages, page + pageWindow); p++) pages.push(p);

  const btn = (label: ReactNode, target: number, disabled = false, active = false, className = "readings-pagination-number") => (
    <button
      key={`${label}-${target}`}
      className={`readings-pagination-btn ${className}`}
      disabled={disabled}
      onClick={() => onPage(target)}
      style={{
        background: active ? "var(--text-primary)" : "transparent",
        color: active ? "var(--bg)" : disabled ? "var(--text-tertiary)" : "var(--text-secondary)",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="readings-pagination">
      <span className="readings-pagination-label">
        Showing {firstShown}-{lastShown} of {totalCount}
      </span>
      <div className="readings-pagination-pages">
        {btn(<ChevronLeft size={14} />, page - 1, page === 1, false, "readings-pagination-control")}
        {pages[0] > 1 && (
          <>
            {btn(1, 1, false, page === 1)}
            {pages[0] > 2 && <span className="readings-pagination-ellipsis">...</span>}
          </>
        )}
        {pages.map((p) => btn(p, p, false, p === page))}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="readings-pagination-ellipsis">...</span>}
            {btn(totalPages, totalPages, false, page === totalPages)}
          </>
        )}
        {btn(<ChevronRight size={14} />, page + 1, page === totalPages, false, "readings-pagination-control")}
      </div>
    </div>
  );
}

function EmptyMap() {
  return (
    <div
      style={{
        height: "100%",
        border: "1px dashed var(--surface-border)",
        borderRadius: "var(--radius-md)",
        background: "color-mix(in oklab, var(--text-primary) 2%, var(--bg))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-tertiary)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.7rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        textAlign: "center",
        padding: "var(--space-md)",
      }}
    >
      No mappable readings on this page
    </div>
  );
}

function EmptyList({
  hasFilters,
  onClear,
  onNew,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onNew: () => void;
}) {
  return (
    <div
      style={{
        padding: "3rem 1rem",
        textAlign: "center",
        color: "var(--text-tertiary)",
        margin: "auto",
      }}
    >
      <div style={{ marginBottom: "var(--space-md)" }}>
        {hasFilters ? "No readings match these filters." : "No readings yet - generate one to see it here."}
      </div>
      {hasFilters ? (
        <button
          onClick={onClear}
          style={{
            background: "transparent",
            border: "1px solid var(--surface-border)",
            color: "var(--text-primary)",
            borderRadius: "var(--radius-full)",
            padding: "0.4rem 1rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            cursor: "pointer",
          }}
        >
          Clear filters
        </button>
      ) : (
        <button onClick={onNew} className="btn btn-primary" style={{ padding: "0.5rem 1rem" }}>
          + New Reading
        </button>
      )}
    </div>
  );
}

function SkeletonBox({ label }: { label: string }) {
  return (
    <div
      style={{
        height: "100%",
        border: "1px solid var(--surface-border)",
        borderRadius: "var(--radius-md)",
        background: "var(--surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-tertiary)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.7rem",
      }}
    >
      {label}
    </div>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <span className="readings-control-label">
    {children}
  </span>
);

const selectStyle: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--surface-border)",
  color: "var(--text-primary)",
  borderRadius: "var(--radius-sm)",
  padding: "0.35rem 0.5rem",
  fontFamily: "var(--font-mono)",
  fontSize: "0.7rem",
  cursor: "pointer",
};
