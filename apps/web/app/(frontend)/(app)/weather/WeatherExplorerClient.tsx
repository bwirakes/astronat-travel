"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { List as ListIcon, Map as MapIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/page-header-context";
import { ReadingsAtlasMap, type AtlasPin } from "@/app/components/ReadingsAtlasMap";
import { BAND_CONFIG, getVerdict, ScoreRing } from "@/app/components/ScoreRing";
import {
  tierAccent,
  tierLabel,
} from "@/app/lib/geodetic/weather-predictions";
import type {
  GeodeticMatrixResponse,
  GeodeticWeatherEvent,
  WeatherEventType,
} from "@/app/lib/geodetic/weather-types";
import {
  weatherEventScore,
  weatherEventToAtlasPin,
  weatherTypeLabel,
} from "./weather-map-pins";

const PAGE_SIZE = 10;

type SortKey = "date" | "pressure" | "type";
type TypeFilter = "all" | WeatherEventType;

const SORT_LABELS: Record<SortKey, string> = {
  date: "Date",
  pressure: "Pressure",
  type: "Type",
};

const TYPE_FILTERS: TypeFilter[] = [
  "all",
  "flood",
  "storm_cyclone",
  "wildfire",
  "heatwave",
  "compound",
];

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function WeatherExplorerClient() {
  const router = useRouter();
  const [matrix, setMatrix] = useState<GeodeticMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"list" | "map">("list");
  const [sort, setSort] = useState<SortKey>("date");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/geodetic-weather/matrix?longitudeResolution=2")
      .then((res) => res.json())
      .then((data: GeodeticMatrixResponse) => {
        if (cancelled) return;
        setMatrix(data);
      })
      .catch((error) => {
        console.error("[/weather] matrix load failed", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const events = useMemo(() => matrix?.sourceCatalog.forecastEvents ?? [], [matrix]);
  const filtered = useMemo(() => {
    const byType = events.filter((event) => typeFilter === "all" || event.type === typeFilter);
    return [...byType].sort((a, b) => {
      if (sort === "pressure") return b.pss - a.pss;
      if (sort === "type") return weatherTypeLabel(a.type).localeCompare(weatherTypeLabel(b.type));
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [events, sort, typeFilter]);

  const pageItems = filtered.slice(0, PAGE_SIZE);
  const pins: AtlasPin[] = useMemo(
    () => pageItems.map((event) => weatherEventToAtlasPin(event)),
    [pageItems],
  );

  const goEvent = (id: string) => router.push(`/weather/${id}`);

  return (
    <>
      <PageHeader title="Sky Weather" />
      <div className="weather-shell">
        <ControlsBar
          sort={sort}
          typeFilter={typeFilter}
          totalCount={filtered.length}
          showingCount={pageItems.length}
          onSort={setSort}
          onType={setTypeFilter}
        />

        <div className="weather-mobile-tabs">
          {(["list", "map"] as const).map((tab) => {
            const active = mobileTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
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
                {tab === "list" ? <ListIcon size={14} /> : <MapIcon size={14} />}
                {tab}
              </button>
            );
          })}
        </div>

        <div className="weather-split">
          <div className="weather-map-col">
            {loading ? (
              <SkeletonBox label="Loading map..." />
            ) : pins.length === 0 ? (
              <EmptyBox label="No forecast events match these filters" />
            ) : (
              <ReadingsAtlasMap
                pins={pins}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onSelect={goEvent}
                showCounter={{ shown: pageItems.length, total: filtered.length }}
              />
            )}
          </div>

          <div className="weather-list-col">
            {loading ? (
              <SkeletonBox label="Loading weather..." />
            ) : filtered.length === 0 ? (
              <EmptyBox label="No weather events match these filters" />
            ) : (
              <div className="weather-list-scroll">
                {pageItems.map((event, index) => (
                  <WeatherRow
                    key={event.id}
                    event={event}
                    index={index}
                    isHighlighted={hoveredId === event.id}
                    onHover={setHoveredId}
                    onSelect={() => goEvent(event.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .weather-shell {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: var(--space-md);
          height: calc(100dvh - var(--page-header-height, 64px));
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .weather-mobile-tabs {
          display: none;
          margin: var(--space-sm) 0;
          gap: 4px;
          border: 1px solid var(--surface-border);
          border-radius: var(--radius-full);
          padding: 3px;
          background: var(--surface);
        }
        .weather-split {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
          gap: var(--space-lg);
          margin-top: var(--space-md);
        }
        .weather-map-col {
          min-height: 0;
          height: 100%;
        }
        .weather-list-col {
          min-height: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--surface-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--surface);
        }
        .weather-list-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .weather-list-scroll::-webkit-scrollbar { width: 8px; }
        .weather-list-scroll::-webkit-scrollbar-thumb {
          background: var(--surface-border);
          border-radius: 4px;
        }
        .weather-list-scroll::-webkit-scrollbar-track { background: transparent; }

        @media (max-width: 1023px) {
          .weather-shell {
            height: auto;
            min-height: calc(100dvh - var(--page-header-height, 64px));
          }
          .weather-mobile-tabs { display: flex; }
          .weather-split {
            grid-template-columns: 1fr;
            gap: var(--space-md);
            min-height: 60vh;
          }
          .weather-map-col {
            display: ${mobileTab === "map" ? "block" : "none"};
            height: 60vh;
          }
          .weather-list-col {
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
  totalCount,
  showingCount,
  onSort,
  onType,
}: {
  sort: SortKey;
  typeFilter: TypeFilter;
  totalCount: number;
  showingCount: number;
  onSort: (sort: SortKey) => void;
  onType: (type: TypeFilter) => void;
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
        <select value={sort} onChange={(event) => onSort(event.target.value as SortKey)} style={selectStyle}>
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Label>Type</Label>
        {TYPE_FILTERS.map((type) => {
          const active = typeFilter === type;
          return (
            <button
              key={type}
              onClick={() => onType(type)}
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
              {type === "all" ? "All" : weatherTypeLabel(type)}
            </button>
          );
        })}
      </div>

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
        {showingCount} of {totalCount}
      </span>
    </div>
  );
}

function WeatherRow({
  event,
  index,
  isHighlighted,
  onHover,
  onSelect,
}: {
  event: GeodeticWeatherEvent;
  index: number;
  isHighlighted: boolean;
  onHover: (id: string | null) => void;
  onSelect: () => void;
}) {
  const score = weatherEventScore(event);
  const verdict = getVerdict(score);
  const ringColor = BAND_CONFIG[verdict].ring;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onMouseEnter={() => onHover(event.id)}
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
          <ScoreRing score={score} verdict={verdict} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: "0.95rem",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {event.title}
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
            {formatDate(event.date)} · {weatherTypeLabel(event.type)} · {tierLabel(event.tier)}
          </div>
        </div>
      </div>
      <button
        style={{
          background: "transparent",
          border: `1px solid ${isHighlighted ? tierAccent(event.tier) : "var(--surface-border)"}`,
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

function SkeletonBox({ label }: { label: string }) {
  return <EmptyBox label={label} solid />;
}

function EmptyBox({ label, solid = false }: { label: string; solid?: boolean }) {
  return (
    <div
      style={{
        height: "100%",
        border: `${solid ? "1px solid" : "1px dashed"} var(--surface-border)`,
        borderRadius: "var(--radius-md)",
        background: solid ? "var(--surface)" : "color-mix(in oklab, var(--text-primary) 2%, var(--bg))",
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
      {label}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
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
}

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
