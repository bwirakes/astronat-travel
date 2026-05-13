"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import posthog from "posthog-js";
import { ArrowRight, ChevronLeft, ChevronRight, Map as MapIcon, List as ListIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScoreRing, getVerdict, BAND_CONFIG } from "@/app/components/ScoreRing";
import type { AtlasPin } from "@/app/components/ReadingsAtlasMap";
import { PageHeader } from "@/components/app/page-header-context";

export const PAGE_SIZE = 10;

// react-zoom-pan-pinch + the SVG world map are heavy. Pull leaflet-style:
// route-scoped, ssr-disabled. The page renders without it; the map slides in.
const ReadingsAtlasMap = dynamic(
  () => import("@/app/components/ReadingsAtlasMap").then(m => ({ default: m.ReadingsAtlasMap })),
  { ssr: false, loading: () => <SkeletonBox label="Loading map…" /> }
);

export type Reading = {
  id: string;
  destination: string;
  lat: number | null;
  lon: number | null;
  score: number;
  travelDate: string;
  travelType: string;
};

export type SortKey = "recent" | "score" | "travel" | "alpha";
export type TypeFilter = "all" | "trip" | "relocation";

const SORT_LABELS: Record<SortKey, string> = {
  recent: "Recent",
  score: "Score",
  travel: "Travel date",
  alpha: "A → Z",
};

interface Props {
  readings: Reading[];
  total: number;
  page: number;
  sort: SortKey;
  typeFilter: TypeFilter;
}

export function ReadingsClient({ readings, total, page, sort, typeFilter }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"list" | "map">("list");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const showingCount = readings.length;

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
          totalCount={total}
          showingCount={showingCount}
          onNew={() => {
            posthog.capture("new_reading_started", { source: "readings_page" });
            router.push("/reading/new");
          }}
        />

        {/* Mobile tab switcher (<lg) */}
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
          {/* Map column */}
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

          {/* List column */}
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
        className="dashboard-fab"
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
      `}</style>
    </>
  );
}

function ControlsBar({
  sort,
  typeFilter,
  onSort,
  onType,
  totalCount,
  showingCount,
  onNew,
}: {
  sort: SortKey;
  typeFilter: TypeFilter;
  onSort: (s: SortKey) => void;
  onType: (t: TypeFilter) => void;
  totalCount: number;
  showingCount: number;
  onNew: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "var(--space-md)",
        padding: "var(--space-sm) 0",
        borderBottom: "1px solid var(--surface-border)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Label>Sort</Label>
        <select value={sort} onChange={(e) => onSort(e.target.value as SortKey)} style={selectStyle}>
          {Object.entries(SORT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Label>Type</Label>
        {(["all", "trip", "relocation"] as TypeFilter[]).map((t) => {
          const active = typeFilter === t;
          return (
            <button
              key={t}
              onClick={() => onType(t)}
              style={{
                background: active ? "var(--text-primary)" : "transparent",
                color: active ? "var(--bg)" : "var(--text-secondary)",
                border: "1px solid var(--surface-border)",
                borderRadius: "var(--radius-full)",
                padding: "0.3rem 0.75rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-md)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
          }}
        >
          {showingCount} of {totalCount}
        </span>
        <button
          onClick={onNew}
          className="btn btn-primary"
          style={{ padding: "0.4rem 0.9rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          + New <ArrowRight size={13} />
        </button>
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
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", minWidth: 0, flex: 1 }}>
        <div style={{ transform: "scale(0.55)", transformOrigin: "left center", marginRight: "-36px", flexShrink: 0 }}>
          <ScoreRing score={reading.score} verdict={verdict} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
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
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const win = 1;
  for (let p = Math.max(1, page - win); p <= Math.min(totalPages, page + win); p++) pages.push(p);

  const btn = (label: React.ReactNode, target: number, disabled = false, active = false) => (
    <button
      key={`${label}-${target}`}
      disabled={disabled}
      onClick={() => onPage(target)}
      style={{
        minWidth: 30,
        height: 30,
        padding: "0 0.55rem",
        background: active ? "var(--text-primary)" : "transparent",
        color: active ? "var(--bg)" : disabled ? "var(--text-tertiary)" : "var(--text-secondary)",
        border: "1px solid var(--surface-border)",
        borderRadius: "var(--radius-sm)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.7rem",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 6,
        padding: "var(--space-sm) var(--space-md)",
        borderTop: "1px solid var(--surface-border)",
        background: "var(--surface)",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
        }}
      >
        Page {page} of {totalPages}
      </span>
      <div style={{ display: "flex", gap: 4 }}>
        {btn(<ChevronLeft size={14} />, page - 1, page === 1)}
        {pages[0] > 1 && (
          <>
            {btn(1, 1, false, page === 1)}
            {pages[0] > 2 && <span style={{ color: "var(--text-tertiary)", padding: "0 4px", alignSelf: "center" }}>…</span>}
          </>
        )}
        {pages.map((p) => btn(p, p, false, p === page))}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span style={{ color: "var(--text-tertiary)", padding: "0 4px", alignSelf: "center" }}>…</span>}
            {btn(totalPages, totalPages, false, page === totalPages)}
          </>
        )}
        {btn(<ChevronRight size={14} />, page + 1, page === totalPages)}
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
        {hasFilters ? "No readings match these filters." : "No readings yet — generate one to see it here."}
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

const Label = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      fontFamily: "var(--font-mono)",
      fontSize: "0.6rem",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
    }}
  >
    {children}
  </span>
);

const selectStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--surface-border)",
  color: "var(--text-primary)",
  borderRadius: "var(--radius-sm)",
  padding: "0.35rem 0.5rem",
  fontFamily: "var(--font-mono)",
  fontSize: "0.7rem",
  cursor: "pointer",
};
