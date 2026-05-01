"use client";

import NatalMockupWheel, { type NatalPlanet } from "@/app/components/NatalMockupWheel";
import TabSection from "./TabSection";
import type { V4VM } from "./types";
import { geodeticPlanetMeaning } from "@/app/lib/geodetic/planet-meanings";

interface Props {
    vm: V4VM;
    isDark: boolean;
    relocatedWheel: { cusps: number[]; planets: NatalPlanet[] } | null;
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";

const ASPECT_LEFT_BORDER: Record<string, string> = {
    "exact": "var(--color-spiced-life)",
    "very-strong": "var(--gold)",
};

export default function WhatShiftsTab({ vm, isDark, relocatedWheel }: Props) {
    const lead = buildLead(vm);
    const seasonal = buildSeasonal(vm);

    return (
        <TabSection
            kicker="What Shifts"
            title="What changes when your chart moves here."
            intro={vm.chrome.step7Intro}
        >
            {/* ─ LEAD ───────────────────────────────────────────────────── */}
            <p
                className="text-[16px] leading-[1.55] m-0 mb-2 max-w-[640px] [text-wrap:pretty]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-primary)", fontWeight: 400 }}
            >
                {lead}
            </p>
            <p
                className="text-[12px] tracking-[0.04em] m-0 mb-8 max-w-[560px]"
                style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
            >
                Same planets, new houses and angles · single wheel at {vm.relocated.travel.place}.
            </p>

            {/* ─ POLES ──────────────────────────────────────────────────── */}
            <div className="grid items-stretch mb-10 gap-5 grid-cols-1 sm:grid-cols-[1fr_40px_1fr]">
                <PolePill
                    tag="Natal chart"
                    place={vm.relocated.birth.place}
                    coords={vm.relocated.birth.coords}
                />
                <div
                    className="flex items-center justify-center text-[28px] sm:rotate-0 rotate-90"
                    style={{ fontFamily: FONT_PRIMARY, color: "var(--text-tertiary)" }}
                >
                    →
                </div>
                <PolePill
                    tag="Relocated to"
                    place={vm.relocated.travel.place}
                    coords={vm.relocated.travel.coords}
                    active
                />
            </div>

            {/* ─ WHEEL ──────────────────────────────────────────────────── */}
            <div className="py-4 mx-auto max-w-[720px] mb-10">
                {relocatedWheel ? (
                    <NatalMockupWheel
                        isDark={isDark}
                        planets={relocatedWheel.planets}
                        cusps={relocatedWheel.cusps}
                    />
                ) : (
                    <p
                        className="text-[10px] tracking-[0.14em] uppercase text-center p-4 m-0"
                        style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                    >
                        Relocated house cusps are not available for this reading.
                    </p>
                )}
            </div>

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
        </TabSection>
    );
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

function SectionHead({ index, title, sub }: { index: string; title: string; sub: string }) {
    return (
        <header className="mb-4">
            <div className="flex items-baseline gap-3 mb-1">
                <span
                    className="text-[10px] tracking-[0.18em] uppercase"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                >
                    §{index}
                </span>
                <h3
                    className="text-[20px] leading-[1.15] tracking-[-0.005em] m-0"
                    style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)", fontWeight: 400 }}
                >
                    {title}
                </h3>
            </div>
            <p
                className="text-[13px] leading-[1.5] font-light m-0 max-w-[560px] [text-wrap:pretty]"
                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
            >
                {sub}
            </p>
        </header>
    );
}

function AngleCard({ angle: a }: { angle: V4VM["relocated"]["angles"][number] }) {
    const moved = signOf(a.natal) !== signOf(a.relocated);
    return (
        <article
            className="px-[22px] py-5 border rounded-[8px] flex flex-col gap-[14px]"
            style={{
                borderColor: moved ? "var(--color-spiced-life)" : "var(--surface-border)",
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

function PolePill({
    tag,
    place,
    coords,
    active,
}: {
    tag: string;
    place: string;
    coords: string;
    active?: boolean;
}) {
    return (
        <div
            className="px-[22px] py-5 border rounded-[8px] flex flex-col gap-[6px]"
            style={{
                background: "var(--bg)",
                borderColor: active ? "var(--color-spiced-life)" : "var(--surface-border)",
            }}
        >
            <div
                className="text-[10px] tracking-[0.18em] uppercase mb-1"
                style={{ fontFamily: FONT_MONO, color: active ? "var(--color-spiced-life)" : "var(--text-tertiary)" }}
            >
                {tag}
            </div>
            <div
                className="text-[24px] leading-[1.1] tracking-[-0.01em]"
                style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
            >
                {place}
            </div>
            <div
                className="text-[11px] tracking-[0.04em]"
                style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
            >
                {coords}
            </div>
        </div>
    );
}
