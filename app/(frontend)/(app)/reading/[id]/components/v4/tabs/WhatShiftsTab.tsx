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

const ASPECT_LEFT_BORDER: Record<string, string> = {
    "exact": "var(--color-spiced-life)",
    "very-strong": "var(--gold)",
};

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
                    />
                </div>
            </div>

            {/* ─ SECTION: CHART RULER REFRAME (teacher-authored) ────────── */}
            {vm.relocated.chartRulerReframe && (
                <ChartRulerReframeCallout cr={vm.relocated.chartRulerReframe} />
            )}

            {/* ─ SECTION: ANGLES ────────────────────────────────────────── */}
            <SectionHead
                index="01"
                title="Your four corners"
                sub="The angles that frame the chart move first — they set the room you walk into."
            />
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mb-12">
                {vm.relocated.angles.map((a, i) => (
                    <AngleCard key={i} angle={a} />
                ))}
            </div>

            {/* ─ SECTION: PLANETS ───────────────────────────────────────── */}
            <SectionHead
                index="02"
                title="Where each planet lands"
                sub="Same ten planets, repackaged into the rooms of this place. The narrative is the move, not the planet."
            />
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mb-12">
                {vm.relocated.planetsInHouses.length === 0 ? (
                    <div
                        className="text-[10px] tracking-[0.14em] uppercase text-center p-4 sm:col-span-2"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        No planet-house shifts available for this reading.
                    </div>
                ) : (
                    vm.relocated.planetsInHouses.map((p, i) => <PlanetShiftCard key={i} row={p} />)
                )}
            </div>

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

            {/* ─ SECTION: ASPECTS ───────────────────────────────────────── */}
            <SectionHead
                index="03"
                title="New aspects to the angles"
                sub="Lines that lit up only here. Tighter orb, louder signal."
            />
            <div className="grid gap-3 grid-cols-1 sm:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] mb-12">
                {vm.relocated.aspectsToAngles.length === 0 && (
                    <div
                        className="text-[10px] tracking-[0.14em] uppercase text-center p-4"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        No tight aspects to the angles in this relocated chart.
                    </div>
                )}
                {vm.relocated.aspectsToAngles.map((a, i) => (
                    <AspectCard key={i} aspect={a} />
                ))}
            </div>

            {/* ─ SECTION: SEASONAL TRIGGERS (new) ───────────────────────── */}
            {seasonal.items.length > 0 && (
                <>
                    <SectionHead
                        index="04"
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
                        index="05"
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
            className="p-4"
            style={{
                border: "1px solid var(--surface-border)",
                borderRadius: "8px",
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
            className="p-4"
            style={{
                border: "1px solid var(--color-spiced-life)",
                borderRadius: "8px",
                background: "color-mix(in oklab, var(--color-spiced-life) 5%, transparent)",
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
}: {
    title: string;
    subtitle: string;
    wheel: { cusps: number[]; planets: NatalPlanet[] } | null;
    isDark: boolean;
    emptyText: string;
    accent?: boolean;
    muted?: boolean;
}) {
    return (
        <section
            className="border rounded-[8px] px-4 py-4"
            style={{
                borderColor: accent ? "var(--color-spiced-life)" : "var(--surface-border)",
                background: "var(--bg)",
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
                <div className="max-w-[760px] mx-auto xl:max-w-[620px]">
                    <NatalMockupWheel
                        isDark={isDark}
                        planets={wheel.planets}
                        cusps={wheel.cusps}
                    />
                </div>
            ) : (
                <p className="text-[10px] tracking-[0.14em] uppercase text-center p-4 m-0" style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}>
                    {emptyText}
                </p>
            )}
        </section>
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

function AngleCard({ angle: a }: { angle: V4VM["relocated"]["angles"][number] }) {
    const moved = signOf(a.natal) !== signOf(a.relocated);
    return (
        <article
            className="px-[22px] py-5 border rounded-[8px] flex flex-col gap-[14px]"
            style={{
                borderColor: "var(--surface-border)",
                background: "var(--bg)",
                borderLeftWidth: moved ? "3px" : "1px",
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
                style={{ background: "var(--surface)" }}
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
        </article>
    );
}

function PlanetShiftCard({ row }: { row: V4VM["relocated"]["planetsInHouses"][number] }) {
    const meaning = geodeticPlanetMeaning(row.planet);
    return (
        <article
            className="px-[20px] py-[18px] border rounded-[8px] flex flex-col gap-3"
            style={{ borderColor: "var(--surface-border)", background: "var(--bg)" }}
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
                style={{ background: "var(--surface)" }}
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

function AspectCard({ aspect: a }: { aspect: V4VM["relocated"]["aspectsToAngles"][number] }) {
    const strengthKey = a.strength.replace(/\s/g, "-");
    const leftBorder = ASPECT_LEFT_BORDER[strengthKey] ?? "var(--color-y2k-blue)";
    return (
        <article
            className="px-5 py-[18px] border rounded-[8px] flex flex-col gap-2"
            style={{
                borderColor: "var(--surface-border)",
                background: "var(--bg)",
                borderLeft: `3px solid ${leftBorder}`,
            }}
        >
            <div className="flex justify-between items-center gap-[10px]">
                <div
                    className="flex items-center gap-2 text-[18px]"
                    style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                >
                    <span className="text-[22px]" style={{ color: "var(--color-spiced-life)" }}>{a.glyph}</span>
                    <span>{a.planet}</span>
                    <span className="text-[14px]" style={{ color: "var(--text-tertiary)" }}>→ {a.toAngle}</span>
                </div>
                <div
                    className="text-[9px] tracking-[0.18em] uppercase px-2 py-1 rounded-full"
                    style={{
                        fontFamily: FONT_MONO,
                        color: "var(--color-spiced-life)",
                        background: "color-mix(in oklab, var(--color-spiced-life) 10%, transparent)",
                    }}
                >
                    {a.strength}
                </div>
            </div>
            <div
                className="text-[11px] tracking-[0.06em] lowercase"
                style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
            >
                {a.aspect}
            </div>
            <p
                className="text-[14px] leading-[1.55] m-0 mt-1 [text-wrap:pretty]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-primary)" }}
            >
                {a.plain}
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
            className="px-5 py-[18px] border rounded-[8px] flex flex-col gap-2"
            style={{
                borderColor: "var(--surface-border)",
                background: "var(--bg)",
                borderLeft: `3px solid ${accent}`,
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

