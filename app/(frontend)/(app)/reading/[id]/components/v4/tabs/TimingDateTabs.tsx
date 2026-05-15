"use client";

export interface TimingTab {
    id: string;
    label: string;
    /** Inclusive day-offset range relative to travelDate. */
    range: [number, number];
}

interface Props {
    tabs: TimingTab[];
    activeTabId: string;
    onTabChange: (tabId: string) => void;
    /** Optional per-tab counts to display next to the label. */
    counts?: Record<string, number>;
    compact?: boolean;
}

/** Day-offset windows for trip readings (90-day axis, lookback −7d). */
export const TRIP_TIMING_TABS: TimingTab[] = [
    { id: "now",   label: "Now (0–30d)",    range: [-7, 30] },
    { id: "soon",  label: "Soon (30–60d)",  range: [30, 60] },
    { id: "later", label: "Later (60–90d)", range: [60, 90] },
    { id: "all",   label: "All",            range: [-7, 90] },
];

/** Day-offset windows for relocation readings (365-day axis from move date). */
export const RELOCATION_TIMING_TABS: TimingTab[] = [
    { id: "first",  label: "Mo 1–3",   range: [0, 90]    },
    { id: "second", label: "Mo 4–6",   range: [90, 180]  },
    { id: "third",  label: "Mo 7–9",   range: [180, 270] },
    { id: "fourth", label: "Mo 10–12", range: [270, 365] },
    { id: "all",    label: "All",      range: [0, 365]   },
];

/** Filter rule — a row whose [entryDay, exitDay] overlaps the active range
 *  is included. Zero-width events (ingresses, station pins) overlap when
 *  exactDay is in the range. */
export function rowInTab(
    entryDay: number,
    exitDay: number,
    tab: TimingTab,
): boolean {
    const [a, b] = tab.range;
    return Math.max(entryDay, a) <= Math.min(exitDay, b);
}

const FM = "var(--font-mono)";
const CONTAINER: React.CSSProperties = {
    display: "flex",
    gap: "0.22rem",
    flexWrap: "wrap",
    margin: 0,
    padding: "0.25rem",
    background: "color-mix(in oklab, var(--surface) 72%, var(--bg))",
    border: "1px solid color-mix(in oklab, var(--text-primary) 12%, var(--surface-border))",
    borderRadius: "var(--radius-sm)",
    width: "fit-content",
};

const BUTTON_BASE: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: FM,
    fontSize: "0.62rem",
    letterSpacing: "0.13em",
    textTransform: "uppercase",
    fontWeight: 600,
    padding: "0.48rem 0.68rem 0.43rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    borderRadius: "calc(var(--radius-sm) - 2px)",
    background: "transparent",
    color: "var(--text-secondary)",
    cursor: "pointer",
    transition: "background 150ms ease, border-color 150ms ease, color 150ms ease, opacity 150ms ease",
    whiteSpace: "nowrap",
    opacity: 0.8,
};

const BUTTON_ACTIVE: React.CSSProperties = {
    ...BUTTON_BASE,
    background: "color-mix(in oklab, var(--color-y2k-blue) 7%, var(--surface))",
    borderColor: "color-mix(in oklab, var(--color-y2k-blue) 34%, var(--surface-border))",
    color: "var(--color-y2k-blue)",
    fontWeight: 800,
    opacity: 1,
};

const COUNT_BADGE: React.CSSProperties = {
    fontFamily: FM,
    fontSize: "0.58rem",
    color: "inherit",
    marginLeft: "0.32rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    opacity: 0.62,
};

function compactTabLabel(tab: TimingTab): { primary: string; caption?: string } {
    const monthRange = /^Mo\s+(.+)$/i.exec(tab.label);
    if (monthRange) return { primary: monthRange[1], caption: "months" };
    return { primary: tab.label };
}

export default function TimingDateTabs({
    tabs,
    activeTabId,
    onTabChange,
    counts,
    compact = false,
}: Props) {
    return (
        <div
            style={{
                ...CONTAINER,
                ...(compact
                    ? {
                          display: "grid",
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                          width: "100%",
                      }
                    : null),
            }}
            role="tablist"
            aria-label="Timing date range"
        >
            {tabs.map((tab) => {
                const active = tab.id === activeTabId;
                const count = counts?.[tab.id];
                const compactLabel = compactTabLabel(tab);
                return (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={active}
                        aria-controls={`timing-tab-panel-${tab.id}`}
                        type="button"
                        onClick={() => onTabChange(tab.id)}
                        style={{
                            ...(active ? BUTTON_ACTIVE : BUTTON_BASE),
                            ...(compact
                                ? {
                                      padding: "0.55rem 0.42rem 0.5rem",
                                      textAlign: "center",
                                      justifyContent: "center",
                                      gridColumn: tab.id === "all" ? "1 / -1" : undefined,
                                  }
                                : null),
                        }}
                    >
                        {compact ? (
                            <span style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "0.14rem",
                                lineHeight: 1,
                            }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.28rem" }}>
                                    {compactLabel.primary}
                                    {typeof count === "number" && (
                                        <span style={{ ...COUNT_BADGE, marginLeft: 0 }}>· {count}</span>
                                    )}
                                </span>
                                {compactLabel.caption && (
                                    <span style={{
                                        fontSize: "0.48rem",
                                        letterSpacing: "0.16em",
                                        color: "var(--text-tertiary)",
                                        fontWeight: 600,
                                    }}>
                                        {compactLabel.caption}
                                    </span>
                                )}
                            </span>
                        ) : (
                            <>
                                {tab.label}
                                {typeof count === "number" && (
                                    <span style={COUNT_BADGE}>· {count}</span>
                                )}
                            </>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
