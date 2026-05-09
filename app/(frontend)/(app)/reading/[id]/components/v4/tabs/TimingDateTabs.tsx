"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

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
const FB = "var(--font-body)";

const CONTAINER: React.CSSProperties = {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap",
    margin: "0 0 var(--space-md) 0",
    padding: "0.25rem",
    background: "color-mix(in oklab, var(--surface-border) 30%, transparent)",
    borderRadius: "var(--radius-md)",
    width: "fit-content",
};

const BUTTON_BASE: React.CSSProperties = {
    fontFamily: FB,
    fontSize: "0.78rem",
    fontWeight: 500,
    padding: "0.45rem 0.95rem",
    borderRadius: "calc(var(--radius-md) - 0.2rem)",
    // Longhand so the active-state borderColor override doesn't clash.
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    background: "transparent",
    color: "var(--text-secondary)",
    cursor: "pointer",
    transition: "background 150ms ease, color 150ms ease",
    whiteSpace: "nowrap",
};

const BUTTON_ACTIVE: React.CSSProperties = {
    ...BUTTON_BASE,
    background: "var(--surface)",
    color: "var(--text-primary)",
    fontWeight: 600,
    borderColor: "var(--surface-border)",
    boxShadow: "0 1px 2px color-mix(in oklab, black 6%, transparent)",
};

const COUNT_BADGE: React.CSSProperties = {
    fontFamily: FM,
    fontSize: "0.62rem",
    color: "var(--text-tertiary)",
    marginLeft: "0.45rem",
    fontWeight: 500,
};

export default function TimingDateTabs({
    tabs,
    activeTabId,
    onTabChange,
    counts,
}: Props) {
    return (
        <div style={CONTAINER} role="tablist" aria-label="Timing date range">
            {tabs.map((tab) => {
                const active = tab.id === activeTabId;
                const count = counts?.[tab.id];
                return (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={active}
                        aria-controls={`timing-tab-panel-${tab.id}`}
                        type="button"
                        onClick={() => onTabChange(tab.id)}
                        style={active ? BUTTON_ACTIVE : BUTTON_BASE}
                    >
                        {tab.label}
                        {typeof count === "number" && (
                            <span style={COUNT_BADGE}>· {count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
