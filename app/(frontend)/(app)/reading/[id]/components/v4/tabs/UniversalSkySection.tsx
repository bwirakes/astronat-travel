"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { UniversalSkyState } from "@/app/lib/universal-sky";
import { rankSkyEvents, deriveSkyVerdict } from "@/app/lib/universal-sky-rank";
import {
    templateForKpiCard,
    templateForVerdictLead,
} from "@/app/lib/universal-sky-templates";
import SectionHead from "../../shared/SectionHead";
import SkyKpiCard from "./SkyKpiCard";

interface Props {
    sky: UniversalSkyState;
    /** §-index to render in the header. */
    sectionIndex?: string;
    /** User's goalIds from /reading/new. First entry is treated as the primary
     *  goal and drives the goal-tied action lines on each KPI card. */
    goalIds?: string[];
    /** ISO travel-window start (defaults to today). Drives "during your trip"
     *  flagging on each event so trip-overlapping events get prioritized. */
    travelStartISO?: string;
    /** ISO travel-window end. For trips, travelStart + 7d is a reasonable
     *  default; for relocations, travelStart + 365d. */
    travelEndISO?: string;
}

// ── Styling ────────────────────────────────────────────────────────────────

const DIVIDER: React.CSSProperties = {
    height: 1,
    background: "var(--surface-border)",
};

const FRAMING: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "16px",
    lineHeight: 1.65,
    fontWeight: 300,
    color: "var(--text-secondary)",
    margin: "0 0 var(--space-md) 0",
    maxWidth: "62ch",
};

const VERDICT_HEADLINE: React.CSSProperties = {
    fontFamily: "var(--font-primary)",
    fontSize: "clamp(1.4rem, 2.4vw, 1.75rem)",
    fontWeight: 500,
    lineHeight: 1.2,
    color: "var(--text-primary)",
    margin: "0.4rem 0 0.6rem 0",
    maxWidth: "640px",
};

const VERDICT_LEAD: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "1.02rem",
    lineHeight: 1.6,
    color: "var(--text-secondary)",
    margin: "0 0 var(--space-lg) 0",
    maxWidth: "640px",
    fontWeight: 400,
};

const KPI_GRID: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1rem",
    marginBottom: "var(--space-md)",
};

// ── Main section — verdict + KPI cards ───────────────────────────────────

export default function UniversalSkySection({
    sky,
    sectionIndex = "03",
    goalIds = [],
    travelStartISO,
    travelEndISO,
}: Props) {
    // Default trip window: refDate → refDate + 7d (a typical trip).
    // For relocations, callers should pass travelEndISO = travelStartISO + 365d.
    const startISO = travelStartISO ?? sky.refDateISO;
    const endISO = travelEndISO ?? new Date(
        new Date(`${startISO}T00:00:00Z`).getTime() + 7 * 86_400_000,
    ).toISOString().slice(0, 10);

    // Cap at 3 cards. More than that is noise — readers stop scanning by card 4.
    const events = rankSkyEvents({
        sky,
        travelStartISO: startISO,
        travelEndISO: endISO,
        maxCards: 3,
    });
    const verdict = deriveSkyVerdict(events);
    const primaryGoalId = goalIds[0];
    const verdictLead = templateForVerdictLead(events, primaryGoalId);

    return (
        <>
            <SectionHead
                index={sectionIndex}
                title="Sky weather (everyone feels this)"
                flush
            />

            <p style={FRAMING}>
                The sky belongs to everyone — these moments aren&apos;t shaped by where you go,
                but they color whatever you do. Here are the few that matter most for your window.
            </p>

            <h3 style={VERDICT_HEADLINE}>{verdict.headline}</h3>
            <p style={VERDICT_LEAD}>{verdictLead}</p>

            {events.length > 0 && (
                <div style={KPI_GRID}>
                    {events.map((event) => {
                        const card = templateForKpiCard(event, primaryGoalId);
                        return <SkyKpiCard key={event.key} event={event} card={card} />;
                    })}
                </div>
            )}

            <div style={{ ...DIVIDER, margin: "var(--space-xl) 0 var(--space-lg)" }} />
        </>
    );
}
