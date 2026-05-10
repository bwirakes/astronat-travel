"use client";

import { useState } from "react";
import NatalMockupWheel, { type NatalPlanet } from "@/app/components/NatalMockupWheel";
import SectionHead from "../../shared/SectionHead";
import TabSection from "../../shared/TabSection";
import type { V4VM } from "./types";
import { geodeticPlanetMeaning } from "@/app/lib/geodetic/planet-meanings";

interface Props {
    vm: V4VM;
    isDark: boolean;
    natalWheel: { cusps: number[]; planets: NatalPlanet[] } | null;
    relocatedWheel: { cusps: number[]; planets: NatalPlanet[] } | null;
    copiedTab?: {
        lead?: string;
        plainEnglishSummary?: string;
        evidenceCaption?: string;
        nextTabBridge?: string;
    };
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";

// Order matches deriveRelocatedAngles in app/lib/reading-viewmodel.ts.
const ANGLE_KEYS = ["ASC", "IC", "DSC", "MC"] as const;

// Red ↔ cyan editorial palette for aspect tone.
const ASPECT_FRICTION = "#D14545";
const ASPECT_HARMONY = "#4FA9B5";
const ASPECT_NEUTRAL = "var(--gold)";

// Position on the friction←→harmony track (0 = full friction, 100 = full harmony).
const ASPECT_X: Record<string, number> = {
    opposition: 6,
    square: 22,
    conjunct: 50,
    sextile: 76,
    trine: 92,
};

const ASPECT_GLYPH: Record<string, string> = {
    opposition: "☍",
    square: "□",
    conjunct: "☌",
    sextile: "⚹",
    trine: "△",
};

function aspectTone(name: string): "friction" | "neutral" | "harmony" {
    if (name === "square" || name === "opposition") return "friction";
    if (name === "trine" || name === "sextile") return "harmony";
    return "neutral";
}

function aspectColor(name: string): string {
    const t = aspectTone(name);
    return t === "friction" ? ASPECT_FRICTION : t === "harmony" ? ASPECT_HARMONY : ASPECT_NEUTRAL;
}

function parseOrb(aspectStr: string): number {
    const m = aspectStr.match(/orb\s+([\d.]+)/);
    return m ? parseFloat(m[1]) : 8;
}

function parseAspectName(aspectStr: string): string {
    return aspectStr.split(" ")[0];
}

// Tighter orb = brighter glyph. Orb 0° → 1.0, orb 8° → 0.42.
function tightnessOpacity(orb: number): number {
    const clamped = Math.max(0, Math.min(8, orb));
    return 0.42 + ((8 - clamped) / 8) * 0.58;
}

function shortAngleLabel(angleName: string): string {
    return angleName.split(/[\s(·]/)[0] || angleName;
}

export default function WhatShiftsTab({ vm, isDark, natalWheel, relocatedWheel, copiedTab }: Props) {
    const lead = buildLead(vm);
    const seasonal = buildSeasonal(vm);
    const [chartMode, setChartMode] = useState<"compare" | "relocated">("compare");

    const tabLead = copiedTab?.lead?.trim() || "";
    const tabIntro = copiedTab?.plainEnglishSummary || vm.chrome.step7Intro;
    const hasAiCopy = tabLead.length > 0 || !!copiedTab?.plainEnglishSummary;

    return (
        <TabSection
            kicker="What Shifts"
            title="What changes when your chart moves here."
            lead={tabLead}
            intro={tabIntro}
        >
            {/* ─ Synthesized fallback lead — only shown when no AI copy ─ */}
            {!hasAiCopy && (
                <p
                    className="text-[16px] leading-[1.55] m-0 mb-2 max-w-[640px] [text-wrap:pretty]"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-primary)", fontWeight: 400 }}
                >
                    {lead}
                </p>
            )}
            {/* ─ CHARTS ──────────────────────────────────────────────────── */}
            <div className="mb-10 max-w-[1080px] mx-auto">
                <header className="mb-4">
                    <div
                        className="flex flex-wrap items-center justify-between gap-3 pb-[10px] border-b"
                        style={{ borderColor: "var(--surface-border)" }}
                    >
                        <div className="flex items-baseline gap-[0.85rem]">
                            <span className="text-[10px] tracking-[0.22em] font-bold" style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}>
                                §01
                            </span>
                            <h3
                                className="m-0"
                                style={{
                                    fontFamily: FONT_PRIMARY,
                                    fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                                    color: "var(--text-primary)",
                                    lineHeight: 1.2,
                                    letterSpacing: "-0.01em",
                                    fontWeight: 500,
                                }}
                            >
                                Chart comparison
                            </h3>
                        </div>
                        <div
                            role="tablist"
                            aria-label="Chart display mode"
                            className="inline-flex p-1 border rounded-full gap-1"
                            style={{ borderColor: "var(--surface-border)", background: "var(--surface)" }}
                        >
                            <ModePill active={chartMode === "compare"} onClick={() => setChartMode("compare")} label="Compare" />
                            <ModePill active={chartMode === "relocated"} onClick={() => setChartMode("relocated")} label="Relocated only" />
                        </div>
                    </div>
                    <p className="m-0 mt-[10px] text-[14px] leading-[1.55]" style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)", fontWeight: 300 }}>
                        Natal baseline vs relocated house emphasis.
                    </p>
                </header>
                <div className={`grid gap-4 ${chartMode === "compare" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"}`}>
                    {chartMode === "compare" && (
                        <ChartPanel
                            title="Natal Chart"
                            subtitle={shortPlace(vm.relocated.birth.place)}
                            isDark={isDark}
                            wheel={natalWheel}
                            emptyText="Natal house cusps are not available for this reading."
                            muted
                        />
                    )}
                    <ChartPanel
                        title="Relocated Chart"
                        subtitle={shortPlace(vm.relocated.travel.place)}
                        isDark={isDark}
                        wheel={relocatedWheel}
                        emptyText="Relocated house cusps are not available for this reading."
                        accent
                        mode="relocated"
                    />
                </div>
            </div>

            {/* ─ SECTION: CHART RULER REFRAME (teacher-authored) ────────── */}
            {vm.relocated.chartRulerReframe && (
                <ChartRulerReframeCallout cr={vm.relocated.chartRulerReframe} />
            )}

            {/* ─ SECTION: FOUR CORNERS AND ASPECTS ──────────────────────── */}
            <SectionHead
                index="01"
                title="Four Corners and Aspects"
                sub="The angles that frame the chart, plus any tight aspects lighting them up here."
            />
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mb-12">
                {vm.relocated.angles.map((a, i) => (
                    <AngleCard
                        key={i}
                        angle={a}
                        aspects={vm.relocated.aspectsToAngles.filter((x) => x.toAngle === ANGLE_KEYS[i])}
                    />
                ))}
            </div>

            {/* ─ SECTION: PLANETS ───────────────────────────────────────── */}
            <SectionHead
                index="02"
                title="Where each planet lands"
                sub="Same ten planets, repackaged into the rooms of this place. The narrative is the move, not the planet."
            />
            {(() => {
                const rows = vm.relocated.planetsInHouses;
                const allStable = rows.length > 0
                    && rows.every((p) => p.natalHouse === p.reloHouse && p.reloHouse !== "—");
                return (
                    <>
                        {allStable && (
                            <p
                                className="text-[14px] leading-[1.6] m-0 mb-6 max-w-[640px] [text-wrap:pretty]"
                                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)", fontWeight: 300 }}
                            >
                                Your house structure barely shifts here — what changes is sky-side and angle-side, not place-side. Each planet stays in roughly the same room.
                            </p>
                        )}
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mb-12">
                            {rows.length === 0 ? (
                                <div
                                    className="text-[10px] tracking-[0.14em] uppercase text-center p-4 sm:col-span-2"
                                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                                >
                                    No planet-house shifts available for this reading.
                                </div>
                            ) : (
                                rows.map((p, i) => <PlanetShiftCard key={i} row={p} />)
                            )}
                        </div>
                    </>
                );
            })()}

            {/* ─ SECTION: ACG LINE NOTES (teacher-authored, optional) ───── */}
            {Object.keys(vm.relocated.acgLineNotes).length > 0 && (
                <>
                    <SectionHead
                        index="02b"
                        title="Planetary lines amplifying here"
                        sub="ACG lines you're walking under at this destination. Time-of-birth dependent — each carries its own flavor."
                    />
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mb-12">
                        {Object.entries(vm.relocated.acgLineNotes).map(([key, note]) => (
                            <AcgLineNoteCard key={key} lineKey={key} note={note} />
                        ))}
                    </div>
                </>
            )}

            {/* ─ SECTION: SEASONAL TRIGGERS (new) ───────────────────────── */}
            {seasonal.items.length > 0 && (
                <>
                    <SectionHead
                        index="03"
                        title="What's stirring this season"
                        sub="Sky-side activations specific to this place — lunations, eclipses, and your slow-moving progressed band."
                    />
                    <div className="grid gap-3 grid-cols-1 sm:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
                        {seasonal.items.map((s, i) => (
                            <SeasonalCard key={i} item={s} />
                        ))}
                    </div>
                </>
            )}

            {/* ─ SECTION: MODALITY HITS (teacher-authored, optional) ────── */}
            {vm.relocated.modalityHits.length > 0 && (
                <>
                    <SectionHead
                        index="04"
                        title="Late-degree pressure points"
                        sub="Hard-aspect transit pairs catching natal placements at 20–29° in the same modality. The cohort flag — anyone in this degree band feels it."
                    />
                    <div className="grid gap-3 grid-cols-1 sm:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
                        {vm.relocated.modalityHits.map((m) => (
                            <ModalityHitCard key={m.hitKey} hit={m} />
                        ))}
                    </div>
                </>
            )}
        </TabSection>
    );
}

// ─── Teacher-copy renderers (what-shifts tab) ─────────────────────────────

function ChartRulerReframeCallout({ cr }: { cr: NonNullable<V4VM["relocated"]["chartRulerReframe"]>; }) {
    return (
        <div
            className="mb-10 p-5 sm:p-6 max-w-[720px] mx-auto"
            style={{
                border: "1px solid var(--gold)",
                borderRadius: "10px",
                background: "color-mix(in oklab, var(--gold) 5%, transparent)",
            }}
        >
            <div
                className="text-[11px] tracking-[0.16em] uppercase mb-2"
                style={{ fontFamily: FONT_MONO, color: "var(--gold)", fontWeight: 700 }}
            >
                Chart ruler · {cr.ruler} · H{cr.fromHouse} → H{cr.toHouse}
            </div>
            <h3
                className="text-[18px] sm:text-[20px] m-0 mb-3"
                style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)", fontWeight: 600 }}
            >
                {cr.headline}
            </h3>
            <p
                className="text-[15px] leading-[1.55] m-0 max-w-[640px]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-primary)" }}
            >
                {cr.body}
            </p>
        </div>
    );
}

function AcgLineNoteCard({ lineKey, note }: { lineKey: string; note: { headline: string; body: string }; }) {
    const [planet, angle] = lineKey.split("-");
    return (
        <div
            className="p-4 rounded-[8px]"
            style={{
                background: "color-mix(in oklab, var(--surface-border) 28%, var(--bg))",
            }}
        >
            <div
                className="text-[10px] tracking-[0.16em] uppercase mb-2"
                style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)", fontWeight: 700 }}
            >
                {planet} · {angle?.toUpperCase()}
            </div>
            <h4
                className="text-[15px] m-0 mb-2"
                style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)", fontWeight: 600 }}
            >
                {note.headline}
            </h4>
            <p
                className="text-[14px] leading-[1.55] m-0"
                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
            >
                {note.body}
            </p>
        </div>
    );
}

function ModalityHitCard({ hit }: { hit: V4VM["relocated"]["modalityHits"][number]; }) {
    return (
        <div
            className="p-4 rounded-[8px]"
            style={{
                background: "color-mix(in oklab, var(--surface-border) 28%, var(--bg))",
            }}
        >
            <div
                className="text-[10px] tracking-[0.16em] uppercase mb-2"
                style={{ fontFamily: FONT_MONO, color: "var(--color-spiced-life)", fontWeight: 700 }}
            >
                {hit.hitKey.replace(/-/g, " · ")}
            </div>
            <h4
                className="text-[15px] m-0 mb-2"
                style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)", fontWeight: 600 }}
            >
                {hit.headline}
            </h4>
            <p
                className="text-[14px] leading-[1.55] m-0"
                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
            >
                {hit.body}
            </p>
        </div>
    );
}

function ChartPanel({
    title,
    subtitle,
    wheel,
    isDark,
    emptyText,
    accent,
    muted,
    mode = "natal",
}: {
    title: string;
    subtitle: string;
    wheel: { cusps: number[]; planets: NatalPlanet[] } | null;
    isDark: boolean;
    emptyText: string;
    accent?: boolean;
    muted?: boolean;
    mode?: "natal" | "relocated";
}) {
    return (
        <section
            className="rounded-[8px] px-4 py-4"
            style={{
                background: "color-mix(in oklab, var(--surface-border) 28%, var(--bg))",
                opacity: muted ? 0.88 : 1,
            }}
        >
            <header className="flex items-baseline justify-between gap-2 mb-2">
                <h3 className="text-[16px] m-0 uppercase tracking-[0.08em]" style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}>
                    {title}
                </h3>
                <span className="text-[9px] tracking-[0.16em] uppercase" style={{ fontFamily: FONT_MONO, color: accent ? "var(--color-spiced-life)" : "var(--text-tertiary)" }}>
                    {subtitle}
                </span>
            </header>
            {wheel ? (
                <>
                    <div className="max-w-[760px] mx-auto xl:max-w-[620px]">
                        <NatalMockupWheel
                            isDark={isDark}
                            planets={wheel.planets}
                            cusps={wheel.cusps}
                            mode={mode}
                        />
                    </div>
                    <ChartParamStrip cusps={wheel.cusps} accent={accent} />
                </>
            ) : (
                <p className="text-[10px] tracking-[0.14em] uppercase text-center p-4 m-0" style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}>
                    {emptyText}
                </p>
            )}
        </section>
    );
}

function ChartParamStrip({ cusps, accent }: { cusps: number[]; accent?: boolean }) {
    const fmt = (lon: number) => {
        const norm = ((lon % 360) + 360) % 360;
        const signs = ["Ari","Tau","Gem","Can","Leo","Vir","Lib","Sco","Sag","Cap","Aqu","Pis"];
        const idx = Math.floor(norm / 30) % 12;
        const inSign = norm - idx * 30;
        const whole = Math.floor(inSign);
        const min = Math.round((inSign - whole) * 60);
        return `${whole}°${min.toString().padStart(2, "0")}′ ${signs[idx]}`;
    };
    const fields: Array<[string, number]> = [
        ["ASC", cusps[0]], ["IC", cusps[3]], ["DSC", cusps[6]], ["MC", cusps[9]],
    ];
    return (
        <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t"
            style={{ borderColor: "var(--surface-border)" }}
        >
            {fields.map(([k, v]) => (
                <div key={k} className="flex flex-col">
                    <span
                        className="text-[8px] tracking-[0.22em] uppercase font-bold"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        {k}
                    </span>
                    <span
                        className="text-[11px] tabular-nums"
                        style={{
                            fontFamily: FONT_MONO,
                            color: accent ? "var(--color-spiced-life)" : "var(--text-primary)",
                            fontWeight: 500,
                        }}
                    >
                        {fmt(v)}
                    </span>
                </div>
            ))}
        </div>
    );
}

function ModePill({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className="px-3 py-1.5 rounded-full text-[10px] tracking-[0.12em] uppercase border"
            style={{
                fontFamily: FONT_MONO,
                color: active ? "var(--color-spiced-life)" : "var(--text-tertiary)",
                borderColor: active ? "var(--color-spiced-life)" : "transparent",
                background: active
                    ? "color-mix(in oklab, var(--color-spiced-life) 8%, transparent)"
                    : "transparent",
            }}
        >
            {label}
        </button>
    );
}

function shortPlace(place: string): string {
    const parts = place.split(",").map((p) => p.trim()).filter(Boolean);
    return parts.slice(0, 2).join(", ");
}

// ─── Lead synthesizer ──────────────────────────────────────────────────────

function buildLead(vm: V4VM): string {
    // Prefer LLM-authored outcome-first opener when present.
    if (vm.chrome.whatShiftsLead && vm.chrome.whatShiftsLead.trim()) {
        return vm.chrome.whatShiftsLead.trim();
    }
    // Fallback: synthesize from the strongest angle sign-shift.
    const changed = vm.relocated.angles.filter((a) => signOf(a.natal) !== signOf(a.relocated));
    const headline = changed[0] ?? vm.relocated.angles[0];
    if (!headline) return vm.chrome.step7Intro;

    // Use the angle's plain-English topic ("How you come across") as the verb subject.
    const topic = headline.plain || headline.name;
    const place = vm.relocated.travel.place;
    return `In ${place}, ${topic.toLowerCase()} shifts from ${headline.natal} into ${headline.relocated} — the rest of the chart reshapes around that move.`;
}

function signOf(formatted: string): string {
    // "24° Aries" → "Aries"
    const m = formatted.match(/[A-Z][a-z]+$/);
    return m ? m[0] : formatted;
}

// ─── Seasonal triggers builder ────────────────────────────────────────────

interface SeasonalItem {
    kind: "eclipse" | "lunation" | "progression";
    label: string;       // "Solar eclipse · April 8"
    angle?: string;      // "geo-MC"
    natalContact?: string;
    body: string;        // narrative one-liner
    tone: "supportive" | "friction" | "neutral";
}

function buildSeasonal(vm: V4VM): { items: SeasonalItem[] } {
    const items: SeasonalItem[] = [];

    // Eclipses (negative-only, frictional by definition)
    for (const e of vm.eclipses?.hits ?? []) {
        items.push({
            kind: "eclipse",
            label: `${e.kind === "solar" ? "Solar" : "Lunar"} eclipse · ${formatDate(e.dateUtc)}`,
            angle: angleLabel(e.activatedAngle),
            natalContact: e.natalContact,
            body: `${e.kind === "solar" ? "A solar eclipse" : "A lunar eclipse"} at ${formatDeg(e.degree)} ${e.sign} lights up the destination's ${angleLabel(e.activatedAngle)} and brushes your natal ${e.natalContact}. Treat the days around it gently.`,
            tone: "friction",
        });
    }

    // Lunations (bidirectional)
    for (const l of vm.lunations?.hits ?? []) {
        const isNew = l.kind === "new-moon";
        const meaning = geodeticPlanetMeaning(l.natalContact);
        const themeHint = meaning ? ` — ${meaning.theme}` : "";
        items.push({
            kind: "lunation",
            label: `${isNew ? "New moon" : "Full moon"} · ${formatDate(l.dateUtc)}`,
            angle: angleLabel(l.activatedAngle),
            natalContact: l.natalContact,
            body: `${isNew ? "Fresh-start" : "Exposure"} signature at ${formatDeg(l.degree)} ${l.sign}, on the ${angleLabel(l.activatedAngle)} and your natal ${l.natalContact}${themeHint}.`,
            tone: isNew ? "supportive" : "friction",
        });
    }

    // Progressions: only if the destination falls in a band
    if (vm.progressions) {
        for (const b of vm.progressions.bands) {
            if (!b.destinationInBand) continue;
            const isSun = b.planet === "Sun";
            items.push({
                kind: "progression",
                label: `Progressed ${b.planet} band`,
                body: isSun
                    ? `Your progressed Sun is in ${b.sign} (${b.longitudeRange}), the slow identity-band you're moving through. This place sits inside it — the alignment is multi-year.`
                    : `Your progressed Moon is in ${b.sign} (${b.longitudeRange}), the ~2.5-year emotional home zone. This place sits inside it.`,
                tone: "supportive",
            });
        }
    }

    // Sort by tone (friction first to flag caution), then by label
    items.sort((a, b) => {
        if (a.tone === b.tone) return a.label.localeCompare(b.label);
        if (a.tone === "friction") return -1;
        if (b.tone === "friction") return 1;
        return 0;
    });
    return { items };
}

function angleLabel(activated: "geoMC" | "geoIC" | "geoASC" | "geoDSC"): string {
    return ({ geoMC: "geodetic MC", geoIC: "geodetic IC", geoASC: "geodetic ASC", geoDSC: "geodetic DSC" })[activated];
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(0, 10);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDeg(deg: number): string {
    const inSign = deg % 30;
    const whole = Math.floor(inSign);
    const min = Math.round((inSign - whole) * 60);
    return `${whole}°${min.toString().padStart(2, "0")}'`;
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function AngleCard({
    angle: a,
    aspects = [],
}: {
    angle: V4VM["relocated"]["angles"][number];
    aspects?: V4VM["relocated"]["aspectsToAngles"];
}) {
    const moved = signOf(a.natal) !== signOf(a.relocated);
    return (
        <article
            className="px-[22px] py-5 rounded-[8px] flex flex-col gap-[14px]"
            style={{
                background: "color-mix(in oklab, var(--surface-border) 28%, var(--bg))",
            }}
        >
            <div className="flex justify-between items-baseline gap-3 flex-wrap">
                <div
                    className="text-[11px] tracking-[0.18em] uppercase"
                    style={{ fontFamily: FONT_MONO, color: moved ? "var(--color-spiced-life)" : "var(--color-y2k-blue)" }}
                >
                    {a.name}
                </div>
                <div
                    className="text-[13px] italic font-light"
                    style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                >
                    {a.plain}
                </div>
            </div>
            <div
                className="grid items-center gap-2 p-3 rounded-[4px] grid-cols-[1fr_20px_1fr] min-w-0"
                style={{
                    background: "color-mix(in oklab, var(--surface-border) 60%, var(--bg))",
                }}
            >
                <div>
                    <div
                        className="text-[9px] tracking-[0.16em] uppercase"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        Natally
                    </div>
                    <div
                        className="text-[18px] leading-[1.1] tracking-[-0.005em] mt-[2px]"
                        style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                    >
                        {a.natal}
                    </div>
                </div>
                <div className="text-center" style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}>→</div>
                <div>
                    <div
                        className="text-[9px] tracking-[0.16em] uppercase"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        Here
                    </div>
                    <div
                        className="text-[18px] leading-[1.1] tracking-[-0.005em] mt-[2px]"
                        style={{ fontFamily: FONT_PRIMARY, color: moved ? "var(--color-spiced-life)" : "var(--text-primary)" }}
                    >
                        {a.relocated}
                    </div>
                </div>
            </div>
            <p
                className="text-[13px] leading-[1.55] font-light m-0 [text-wrap:pretty]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
            >
                {a.delta}
            </p>
            {aspects.length > 0 && (
                <div className="flex flex-col gap-3 pt-3 border-t" style={{ borderColor: "var(--surface-border)" }}>
                    <div
                        className="text-[9px] tracking-[0.22em] uppercase font-bold"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        Aspects to {shortAngleLabel(a.name)}
                    </div>
                    <AspectSpectrum aspects={aspects} />
                    <div className="flex flex-col gap-2">
                        {aspects.map((asp, i) => (
                            <AspectRow key={i} aspect={asp} angleShort={shortAngleLabel(a.name)} />
                        ))}
                    </div>
                </div>
            )}
        </article>
    );
}

function AspectSpectrum({ aspects }: { aspects: V4VM["relocated"]["aspectsToAngles"] }) {
    return (
        <div className="flex flex-col gap-[6px] py-2">
            <div className="flex justify-between items-center" style={{ fontFamily: FONT_MONO }}>
                <span
                    className="text-[8px] tracking-[0.22em] uppercase"
                    style={{ color: ASPECT_FRICTION, fontWeight: 700 }}
                >
                    friction
                </span>
                <span
                    className="text-[8px] tracking-[0.22em] uppercase"
                    style={{ color: "var(--text-tertiary)", fontWeight: 700 }}
                >
                    angle
                </span>
                <span
                    className="text-[8px] tracking-[0.22em] uppercase"
                    style={{ color: ASPECT_HARMONY, fontWeight: 700 }}
                >
                    harmony
                </span>
            </div>
            <div className="relative h-[28px]">
                <div
                    className="absolute left-0 right-0 top-1/2 h-px"
                    style={{
                        background: `linear-gradient(to right, ${ASPECT_FRICTION} 0%, var(--surface-border) 50%, ${ASPECT_HARMONY} 100%)`,
                        transform: "translateY(-50%)",
                    }}
                />
                <div
                    className="absolute top-1/2 left-1/2 w-[1px] h-3"
                    style={{
                        background: "var(--text-tertiary)",
                        transform: "translate(-50%, -50%)",
                    }}
                />
                {aspects.map((a, i) => {
                    const name = parseAspectName(a.aspect);
                    const orb = parseOrb(a.aspect);
                    const x = ASPECT_X[name] ?? 50;
                    const opacity = tightnessOpacity(orb);
                    const color = aspectColor(name);
                    return (
                        <div
                            key={i}
                            className="absolute top-1/2"
                            style={{
                                left: `${x}%`,
                                transform: "translate(-50%, -50%)",
                            }}
                            title={`${a.planet} ${name} · orb ${orb.toFixed(1)}°`}
                        >
                            <span
                                className="block text-[18px] leading-none"
                                style={{
                                    color,
                                    opacity,
                                    fontFamily: FONT_PRIMARY,
                                    textShadow: `0 0 6px color-mix(in oklab, ${color} 40%, transparent)`,
                                }}
                            >
                                {a.glyph}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function AspectRow({
    aspect: a,
    angleShort,
}: {
    aspect: V4VM["relocated"]["aspectsToAngles"][number];
    angleShort: string;
}) {
    const name = parseAspectName(a.aspect);
    const orb = parseOrb(a.aspect);
    const accent = aspectColor(name);
    const glyph = ASPECT_GLYPH[name] ?? "·";
    return (
        <div
            className="pl-3 flex flex-col gap-1"
            style={{ borderLeft: `2px solid ${accent}` }}
        >
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <div
                    className="flex items-baseline gap-[6px] text-[13px] flex-wrap"
                    style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                >
                    <span className="text-[15px]" style={{ color: accent }}>{a.glyph}</span>
                    <span className="font-medium">{a.planet}</span>
                    <span className="text-[14px]" style={{ color: accent }}>{glyph}</span>
                    <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{angleShort}</span>
                </div>
                <div
                    className="text-[10px] tracking-[0.04em] tabular-nums"
                    style={{ fontFamily: FONT_MONO, color: accent, fontWeight: 600 }}
                >
                    orb {orb.toFixed(1)}°
                </div>
            </div>
            <p
                className="text-[12px] leading-[1.5] m-0 [text-wrap:pretty]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
            >
                {a.plain}
            </p>
        </div>
    );
}

function PlanetShiftCard({ row }: { row: V4VM["relocated"]["planetsInHouses"][number] }) {
    const meaning = geodeticPlanetMeaning(row.planet);
    return (
        <article
            className="px-[20px] py-[18px] rounded-[8px] flex flex-col gap-3"
            style={{
                background: "color-mix(in oklab, var(--surface-border) 28%, var(--bg))",
            }}
        >
            <header className="flex items-baseline justify-between gap-3">
                <div className="flex items-center gap-[10px]">
                    <span
                        className="text-[24px] w-[24px] text-center leading-none"
                        style={{ color: "var(--color-spiced-life)" }}
                    >
                        {row.glyph}
                    </span>
                    <span
                        className="text-[18px] leading-[1.1]"
                        style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                    >
                        {row.planet}
                    </span>
                </div>
                {meaning && (
                    <span
                        className="text-[10px] tracking-[0.06em] italic font-light text-right max-w-[160px]"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-tertiary)" }}
                    >
                        {meaning.theme}
                    </span>
                )}
            </header>
            <div
                className="grid items-stretch gap-2 p-2 rounded-[4px] grid-cols-[1fr_18px_1fr]"
                style={{ background: "color-mix(in oklab, var(--surface-border) 60%, var(--bg))" }}
            >
                <div className="px-2">
                    <div
                        className="text-[9px] tracking-[0.16em] uppercase"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        Back home
                    </div>
                    <div
                        className="text-[12px] tracking-[0.02em] mt-[2px]"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-primary)" }}
                    >
                        {row.natalHouse}
                    </div>
                </div>
                <div className="text-center self-center" style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}>→</div>
                <div className="px-2">
                    <div
                        className="text-[9px] tracking-[0.16em] uppercase"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        Here
                    </div>
                    <div
                        className="text-[12px] tracking-[0.02em] font-medium mt-[2px]"
                        style={{ fontFamily: FONT_MONO, color: "var(--color-spiced-life)" }}
                    >
                        {row.reloHouse}
                    </div>
                </div>
            </div>
            <p
                className="text-[13px] leading-[1.55] font-light m-0 [text-wrap:pretty]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
            >
                {row.shift}
            </p>
        </article>
    );
}

function SeasonalCard({ item }: { item: SeasonalItem }) {
    const accent =
        item.tone === "supportive" ? "var(--gold)" :
        item.tone === "friction" ? "var(--color-spiced-life)" :
        "var(--color-y2k-blue)";
    return (
        <article
            className="px-5 py-[18px] rounded-[8px] flex flex-col gap-2"
            style={{
                background: "color-mix(in oklab, var(--surface-border) 28%, var(--bg))",
            }}
        >
            <header className="flex items-baseline justify-between gap-2 flex-wrap">
                <div
                    className="text-[11px] tracking-[0.18em] uppercase"
                    style={{ fontFamily: FONT_MONO, color: accent }}
                >
                    {item.label}
                </div>
                {item.angle && (
                    <div
                        className="text-[10px] tracking-[0.06em] lowercase italic font-light"
                        style={{ fontFamily: FONT_BODY, color: "var(--text-tertiary)" }}
                    >
                        on your {item.angle}
                    </div>
                )}
            </header>
            <p
                className="text-[13px] leading-[1.55] m-0 [text-wrap:pretty]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-primary)" }}
            >
                {item.body}
            </p>
            {item.natalContact && (
                <div
                    className="text-[10px] tracking-[0.06em] lowercase"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                >
                    natal {item.natalContact}
                </div>
            )}
        </article>
    );
}

