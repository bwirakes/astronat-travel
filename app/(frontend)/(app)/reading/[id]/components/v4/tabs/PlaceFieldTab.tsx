"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import AcgLinesCard from "@/app/components/AcgLinesCard";
import NatalWithGeodeticOverlay from "@/app/components/NatalWithGeodeticOverlay";
import GeodeticHouseWheel from "../wheels/GeodeticHouseWheel";
import ReadingGeodeticMap from "../parts/ReadingGeodeticMap";
import { acgLineRawScore } from "@/app/lib/house-matrix";
import { geodeticASCLongitude, geodeticMCLongitude, signFromLongitude } from "@/app/lib/geodetic";
import { geodeticPlanetMeaning } from "@/app/lib/geodetic/planet-meanings";
import { HOUSE_THEMES, HOUSE_DOMAIN_SHORT } from "@/app/lib/astro-constants";
import type { PersonalGeodeticHit } from "@/app/lib/reading-tabs";
import type { V4EclipseHit, V4GeoTransit, V4LunationHit, V4Paran, V4ProgressedBand } from "@/app/lib/reading-viewmodel";
import SectionHead from "./SectionHead";
import TabSection from "./TabSection";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    birthIso: string | undefined;
    reading: any;
    relocatedAcgLines: any[];
    natalForMap?: unknown;
}

type Anchor = "ASC" | "IC" | "DSC" | "MC";

const ANGLE_FULL: Record<Anchor, string> = {
    ASC: "Ascendant",
    IC:  "Nadir",
    DSC: "Descendant",
    MC:  "Midheaven",
};

const ANGLE_TOPIC: Record<Anchor, string> = {
    ASC: "self",
    IC:  "home",
    DSC: "partners",
    MC:  "career",
};

const ANGLE_DESC: Record<Anchor, string> = {
    ASC: "The face you show the world here.",
    IC:  "Roots, home, and where you anchor.",
    DSC: "Who you attract and reflect here.",
    MC:  "How your work and authority land.",
};

const FRAMEWORK_STEPS: Array<[string, string]> = [
    ["Establish your base chart",       "Natal chart — date, time, place must be accurate."],
    ["Calculate the geodetic frame",    "Derive geodetic MC (from longitude) and ASC (from longitude + latitude) for the destination."],
    ["Map natal planets to geodetic degrees", "Convert each natal planet's position to a geographic longitude on the world map."],
    ["Identify active zones",           "Find where current transit / eclipse / lunation degrees land using the geodetic formula."],
    ["Layer temporal techniques",       "Apply transits, progressions, and Solar Arc directions to the geodetic frame for precise timing."],
    ["Interpret the houses",            "Read the geodetic house themes for the target — what life domains are activated?"],
];

// Shared text style constants — mirrors /chart
const KICKER: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.55rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "var(--text-tertiary)",
    fontWeight: 600,
    marginBottom: "0.75rem",
};

const DIVIDER: React.CSSProperties = {
    height: 1,
    background: "var(--surface-border)",
};

// Three normalized body sizes used across the tab
const BODY: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    color: "var(--text-secondary)",
    fontWeight: 400,
};

const BODY_MUTED: React.CSSProperties = {
    ...BODY,
    color: "var(--text-tertiary)",
    margin: "0 0 var(--space-md) 0",
    maxWidth: "640px",
};

const BODY_CAPTION: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "0.82rem",
    lineHeight: 1.55,
    color: "var(--text-tertiary)",
};

const MONO_SM: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.6rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    fontWeight: 600,
};

const DATELINE: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.7rem",
    color: "var(--text-tertiary)",
    display: "flex",
    gap: "1.25rem",
    flexWrap: "wrap",
    opacity: 0.85,
};

// ─── Sign-aware angle copy ───────────────────────────────────────────────

const ANGLE_FRAME: Record<Anchor, { topic: string; verb: string }> = {
    ASC: { topic: "the way the city reads you",      verb: "filters how you land" },
    MC:  { topic: "the public face",                 verb: "shapes what you become known for" },
    DSC: { topic: "the partners this place brings",  verb: "sets who you mirror" },
    IC:  { topic: "the foundation",                  verb: "anchors what stays hidden" },
};

// Short labels used as a prose prefix in the four-corner block copy.
const ANCHOR_LABEL: Record<Anchor, string> = {
    ASC: "Arrival",
    MC:  "Public face",
    DSC: "Partners",
    IC:  "Foundation",
};

// Magazine-voice planet lexicon. Place-tab-only — does not propagate to the
// AI prompt or other tabs. Four slots per planet:
//   verb         — used in four-corner inline copy ("Saturn weighs it.")
//   tail         — sensory tail used as the loudest planet's flavour
//   cityCharacter — what the city BECOMES when this planet is loudest;
//                   used in the synthesis sentence of the opener lede
//   shortFlavour — folded into the lede when this planet is secondary
const PLANET_LEX: Record<string, {
    verb: string;
    tail: string;
    cityCharacter: string;
    shortFlavour: string;
}> = {
    sun: {
        verb: "lights up",
        tail: "leadership lands on you whether you wanted the spotlight or not",
        cityCharacter: "a leadership-coded, performative stage",
        shortFlavour: "leadership pressure",
    },
    moon: {
        verb: "tunes",
        tail: "the city's daily rhythm runs through you here",
        cityCharacter: "a rhythmic, mood-driven, neighbourhood-coded place",
        shortFlavour: "everyday rhythm",
    },
    mercury: {
        verb: "quickens",
        tail: "you talk, deal, and move before you've fully arrived",
        cityCharacter: "a fast-talking, exchange-driven hub",
        shortFlavour: "voice in motion",
    },
    venus: {
        verb: "sweetens",
        tail: "money, art, and ease show up in the small encounters",
        cityCharacter: "an easy, beautiful, money-touched ground",
        shortFlavour: "ease and money",
    },
    mars: {
        verb: "sharpens",
        tail: "fast moves, friction, the kind of presence that gets to the point",
        cityCharacter: "a fast, contested, urgent compound",
        shortFlavour: "edge and urgency",
    },
    jupiter: {
        verb: "widens",
        tail: "money flows, doctrines form, an embassy quality settles in",
        cityCharacter: "a wide, doctrinal, embassy-flavoured field",
        shortFlavour: "expansive flow",
    },
    saturn: {
        verb: "weighs",
        tail: "the city's bones come up — old, slow, hard to dismiss",
        cityCharacter: "a weighted, structured, slow-moving ground",
        shortFlavour: "old gravity",
    },
    uranus: {
        verb: "jolts",
        tail: "sudden, tech-edged, a little contentious",
        cityCharacter: "an unstable, tech-edged, sudden ground",
        shortFlavour: "sudden rupture",
    },
    neptune: {
        verb: "dissolves",
        tail: "the edges blur — devotion, art, fog, sometimes deception",
        cityCharacter: "a permeable, devotional, foggy field",
        shortFlavour: "blurred edges",
    },
    pluto: {
        verb: "concentrates",
        tail: "high-stakes, underground signal, the kind of current that transforms what it touches",
        cityCharacter: "a high-stakes, underground-coded compound",
        shortFlavour: "concentrated stakes",
    },
};

// Short anchor phrases used in the opener's "anchor map" sentence.
const ANCHOR_SHORT: Record<Anchor, string> = {
    ASC: "the arrival",
    MC:  "the public face",
    DSC: "the partners",
    IC:  "the foundation",
};

// Life-domain words for each anchor — surface the H1/H10/H7/H4 themes the
// framework's "Interpret the Houses" step asks for. Single-word forms; the
// opener concatenates these into a "X, Y, and Z all light up here" sentence.
const ANCHOR_DOMAIN: Record<Anchor, string> = {
    ASC: "identity",
    MC:  "career",
    DSC: "partnerships",
    IC:  "home base",
};

const SIGN_FLAVOR: Record<string, string> = {
    Aries: "direct, edge-first", Taurus: "slow, sensory, grounded",
    Gemini: "talky, exchange-driven", Cancer: "tender, family-coloured",
    Leo: "dramatic, performative", Virgo: "precise, fix-it",
    Libra: "relational, design-led", Scorpio: "intense, depth-seeking",
    Sagittarius: "expansive, philosophical", Capricorn: "structured, ambitious",
    Aquarius: "experimental, network-driven", Pisces: "permeable, dreamy",
};

export default function PlaceFieldTab({ vm, birthIso, reading, relocatedAcgLines }: Props) {
    const { lat, lon, city } = vm.location;
    const geoMC  = geodeticMCLongitude(lon);
    const geoASC = geodeticASCLongitude(lon, lat);

    const angleLons: Record<Anchor, number> = {
        ASC: geoASC,
        MC:  geoMC,
        DSC: (geoASC + 180) % 360,
        IC:  (geoMC  + 180) % 360,
    };

    const hits = vm.scoreNarrative.geodetic.personal;

    // Tightest hit per anchor (for corner grid)
    const tightestPerAnchor = new Map<Anchor, PersonalGeodeticHit>();
    for (const row of hits) {
        for (const hit of row.hits) {
            const cur = tightestPerAnchor.get(row.anchor);
            if (!cur || hit.orbDeg < cur.orbDeg) tightestPerAnchor.set(row.anchor, hit);
        }
    }

    // All flat hits (for the contact table)
    const flatHits = hits.flatMap((row) => row.hits.map((hit) => ({ row, hit })));
    const hitNotes = extractGeodeticHitNotes(reading);

    // Wheel data
    const natalPlanetsForWheel = (reading?.natalPlanets ?? []).map((p: any) => ({
        planet:    String(p.name ?? p.planet ?? ""),
        longitude: typeof p.longitude === "number" ? p.longitude : 0,
        sign:      p.sign,
        house:     typeof p.house === "number" ? p.house : undefined,
    }));
    const cusps = Array.isArray(reading?.relocatedCusps) && reading.relocatedCusps.length === 12
        ? reading.relocatedCusps
        : new Array(12).fill(0).map((_, i) => i * 30);

    // 4-corner summary rows (sign-aware copy + tightest hit per anchor)
    const cornerRows = (["ASC", "MC", "DSC", "IC"] as const).map((anchor) => {
        const lonAngle = angleLons[anchor];
        const sign = signFromLongitude(lonAngle);
        const deg  = Math.floor(((lonAngle % 30) + 30) % 30);
        const hit  = tightestPerAnchor.get(anchor);
        return { anchor, sign, deg, hit };
    });

    const liveItems = buildLiveItems(vm);
    const timing: TimingState = {
        skyHasContent: liveItems.length > 0,
        hasProgressedBand: vm.progressions?.bands.some((b) => b.destinationInBand) ?? false,
    };
    const opener = buildOpener({ city, cornerRows, timing });
    const interpretations = buildGeodeticInterpretations(
        vm.geodeticHouseFrame.natalAssignments,
        reading?.natalPlanets ?? [],
    );

    return (
        <TabSection kicker="Geography" title={`${city} · Geodetic field`}>
            {/* Dateline — coordinates, travel date, derived geodetic angles. */}
            <div style={{ ...DATELINE, marginBottom: "var(--space-md)" }}>
                <span>{lat.toFixed(2)}°, {lon.toFixed(2)}°</span>
                <span>{vm.travelDateISO ? vm.travelDateISO.slice(0, 10) : "any time"}</span>
                <span>geo-ASC {signFromLongitude(geoASC)} · geo-MC {signFromLongitude(geoMC)}</span>
            </div>

            {/* ── Personalised opener (replaces verdict + how-to-read) ── */}
            <Opener data={opener} />

            <div style={{ ...DIVIDER, margin: "var(--space-lg) 0" }} />

            {/* ── §01 What this place activates ────────────────────────── */}
            <SectionHead index="01" title={`What ${city} activates in your chart`}  flush />
            <div className="chart-overview-grid" style={{ marginBottom: "var(--space-md)" }}>
                <div>
                    <div style={KICKER}>The four corners</div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {cornerRows.map(({ anchor, sign, deg, hit }) => {
                            const tight = hit && hit.orbDeg <= 3;
                            const accent = hit ? familyAccent(hit.family) : "var(--text-tertiary)";
                            return (
                                <div key={anchor} style={{
                                    borderBottom: "1px solid var(--surface-border)",
                                    padding: "0.85rem 0",
                                    background: tight ? "color-mix(in oklab, var(--gold) 5%, transparent)" : "transparent",
                                }}>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
                                        <span style={{ ...MONO_SM, color: "var(--text-tertiary)", minWidth: "2.4rem" }}>
                                            {anchor}
                                        </span>
                                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                                            {sign} {deg}°
                                        </span>
                                        {hit && (
                                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: accent, letterSpacing: "0.08em", fontWeight: tight ? 700 : 500 }}>
                                                {capitalize(hit.planet)} · {hit.orbDeg}° {tight ? "TIGHT" : "close"}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ ...BODY_CAPTION, marginTop: "0.25rem", paddingLeft: "3.15rem" }}>
                                        {anchorCopy(anchor, sign, hit)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ position: "sticky", top: "var(--space-md)" }}>
                    <div style={KICKER}>Natal × geodetic overlay</div>
                    <div style={{ width: "100%", maxWidth: "440px", margin: "0 auto", position: "relative" }}>
                        <NatalWithGeodeticOverlay
                            isDark
                            planets={natalPlanetsForWheel}
                            cusps={cusps}
                            geoMC={geoMC}
                            geoASC={geoASC}
                        />
                    </div>
                    <CornerKey />
                </div>
            </div>

            <div style={{ ...DIVIDER, margin: "var(--space-xl) 0 var(--space-lg)" }} />

            {/* ── §02 What's live now (promoted out of details) ───────── */}
            <SectionHead index="02" title={`What's live in ${city} now`}  flush />
            {vm.progressions && (
                <ProgressionsLine bands={vm.progressions.bands} />
            )}
            {liveItems.length > 0 ? (
                <LiveNowTable items={liveItems} />
            ) : reading?.geodeticEngineVersion ? (
                <p style={BODY_MUTED}>
                    The sky over {city} is quiet right now &mdash; nothing transiting close to its corners.
                </p>
            ) : (
                <p style={BODY_MUTED}>
                    Live transit data wasn&rsquo;t computed for this reading. Generate a fresh
                    reading to see what&rsquo;s lighting {city}&rsquo;s corners now.
                </p>
            )}

            <div style={{ ...DIVIDER, margin: "var(--space-xl) 0 var(--space-lg)" }} />

            {/* ── §03 The frame (geodetic house wheel) ─────────────────── */}
            {vm.geodeticHouseFrame.cusps.length === 12 && (
                <>
                    <SectionHead index="03" title="Where your chart lands on this longitude"  flush />
                    <p style={BODY}>
                        If you swapped your birthplace&rsquo;s clock for {city}&rsquo;s, your natal
                        planets would re-house themselves like this. House 1 starts at the sign of
                        the geodetic Ascendant.
                    </p>
                    <div style={{ width: "100%", maxWidth: "440px", margin: "var(--space-md) auto 0" }}>
                        <GeodeticHouseWheel
                            isDark
                            cusps={vm.geodeticHouseFrame.cusps}
                            natalAssignments={vm.geodeticHouseFrame.natalAssignments}
                            geoASC={geoASC}
                            geoMC={geoMC}
                            lat={lat}
                            lon={lon}
                            city={city}
                        />
                    </div>
                    <div style={{ ...DIVIDER, margin: "var(--space-xl) 0 var(--space-lg)" }} />
                </>
            )}

            {/* ── §04 Life areas through the city's geodetic frame ─────── */}
            {interpretations.length > 0 && (
                <>
                    <SectionHead index="04" title={`Life areas through ${city}'s geodetic frame`}  flush />
                    <p style={BODY}>
                        Re-domained by longitude — which house each natal planet lands in when{" "}
                        {city}&rsquo;s coordinates set the clock. A <em>≠ natal H{"{n}"}</em> chip
                        means the planet sits in a different domain in your birth chart than it does
                        in {city}&rsquo;s geodetic frame.
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: "var(--space-md) 0 0 0" }}>
                        {interpretations.map((it) => (
                            <li
                                key={`gi-${it.house}`}
                                style={{
                                    padding: "0.95rem 0",
                                    borderBottom: "1px solid var(--surface-border)",
                                }}
                            >
                                <div style={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    gap: "0.85rem",
                                    flexWrap: "wrap",
                                }}>
                                    <span style={{ ...MONO_SM, color: "var(--text-tertiary)", minWidth: "2.4rem" }}>
                                        H{it.house}
                                    </span>
                                    <span style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.7rem",
                                        letterSpacing: "0.16em",
                                        textTransform: "uppercase",
                                        color: "var(--gold)",
                                        fontWeight: 700,
                                    }}>
                                        {it.domainShort}
                                    </span>
                                    <span style={{ ...BODY_CAPTION, color: "var(--text-tertiary)" }}>
                                        · {it.domainFull}
                                    </span>
                                    {it.planets.map((p, i) => (
                                        <span
                                            key={`gp-${it.house}-${i}`}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "baseline",
                                                gap: "0.35rem",
                                                fontFamily: "var(--font-mono)",
                                                fontSize: "0.78rem",
                                                color: "var(--text-primary)",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {capitalize(p.name)}
                                            {p.differs && (
                                                <span style={{
                                                    fontFamily: "var(--font-mono)",
                                                    fontSize: "0.58rem",
                                                    letterSpacing: "0.12em",
                                                    textTransform: "uppercase",
                                                    color: "var(--color-spiced-life)",
                                                    border: "1px solid var(--color-spiced-life)",
                                                    borderRadius: "999px",
                                                    padding: "0.1rem 0.4rem",
                                                    fontWeight: 700,
                                                    background: "color-mix(in oklab, var(--color-spiced-life) 8%, transparent)",
                                                }}>
                                                    ≠ natal H{p.natalHouse}
                                                </span>
                                            )}
                                        </span>
                                    ))}
                                </div>
                                <p style={{ ...BODY, fontSize: "0.95rem", margin: "0.4rem 0 0 3.25rem", maxWidth: "640px" }}>
                                    {it.sentence}
                                </p>
                            </li>
                        ))}
                    </ul>
                    <div style={{ ...DIVIDER, margin: "var(--space-xl) 0 var(--space-lg)" }} />
                </>
            )}

            {/* ── §05 Where the city sits in the zodiac ────────────────── */}
            <SectionHead index="05" title={`Where ${city} sits in the zodiac`}  flush />
            <p style={BODY}>
                {city} sits where {signFromLongitude(geoMC)} runs overhead and{" "}
                {signFromLongitude(geoASC)} rises on the horizon. The shaded band is the slice of
                sky this longitude owns.
                {vm.parans.length > 0 && " Horizontal lines mark paran latitudes from your chart."}
            </p>
            <div style={{ maxWidth: "min(100%, 540px)", marginTop: "var(--space-md)" }}>
                <ReadingGeodeticMap
                    lat={lat}
                    lon={lon}
                    city={city}
                    parans={vm.parans
                        .filter((p) => Math.abs(p.latOffset) <= 28)
                        .map((p) => ({
                            p1: p.p1, p2: p.p2,
                            aspect: p.aspect || undefined,
                            lat: p.lat,
                            contribution: p.contribution,
                        }))}
                />
            </div>

            {/* ── §06 Latitude crossings (only when present) ───────────── */}
            {vm.parans.length > 0 && (
                <>
                    <div style={{ ...DIVIDER, margin: "var(--space-xl) 0 var(--space-lg)" }} />
                    <SectionHead index="06" title="Latitude crossings"  flush />
                    <p style={BODY_MUTED}>
                        Pairs of your natal planets that cross the horizon together at a latitude
                        near {city}&rsquo;s. Tight benefic pairs lift the field; tight malefic pairs
                        press it.
                    </p>
                    <ParanList parans={vm.parans} city={city} />
                </>
            )}

            <div style={{ ...DIVIDER, margin: "var(--space-xl) 0 var(--space-lg)" }} />

            {/* ── Receipts (collapsed) ─────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
                {flatHits.length > 0 && (
                    <DetailsBlock title={`All planetary contacts within 5° (${flatHits.length})`}>
                        <ContactTable rows={flatHits} notes={hitNotes} />
                    </DetailsBlock>
                )}

                <DetailsBlock title="Astrocartography lines (reference)">
                    <AcgLinesCard
                        planetLines={relocatedAcgLines.map((l: any) => {
                            const angleStr = String(l.angle ?? l.line ?? "");
                            const km = typeof l.distance_km === "number"
                                ? l.distance_km
                                : Number(String(l.distance ?? "").match(/\d+/)?.[0] ?? 0);
                            return {
                                planet: String(l.planet ?? ""),
                                angle: angleStr,
                                distance_km: km,
                                orb: typeof l.orb === "number" ? l.orb : undefined,
                                is_paran: !!l.is_paran,
                                contribution: acgLineRawScore({
                                    planet: String(l.planet ?? ""),
                                    angle: angleStr.toUpperCase(),
                                    distance_km: km,
                                }),
                            };
                        })}
                        natalPlanets={(reading?.natalPlanets || []).map((p: any) => ({
                            planet: String(p.name ?? p.planet ?? ""),
                            sign: String(p.sign ?? ""),
                            degree: typeof p.longitude === "number" ? Math.floor(p.longitude % 30) : 0,
                            longitude: typeof p.longitude === "number" ? p.longitude : 0,
                            retrograde: !!p.retrograde,
                            house: typeof p.house === "number" ? p.house : 0,
                            dignity: p.dignity,
                        }))}
                        birthCity={reading?.birth?.city || "—"}
                        destination={vm.location.city}
                    />
                </DetailsBlock>

                <DetailsBlock title="The method · how this is computed">
                    <ol style={{
                        margin: 0, paddingLeft: "1.25rem",
                        display: "flex", flexDirection: "column", gap: "0.75rem",
                        ...BODY,
                    }}>
                        {FRAMEWORK_STEPS.map(([title, body], i) => (
                            <li key={`step-${i}`}>
                                <strong style={{ color: "var(--text-primary)" }}>{title}.</strong>{" "}
                                {body}
                            </li>
                        ))}
                    </ol>
                    {vm.chrome.step4GeodeticMethod && (
                        <p style={{ ...BODY_MUTED, margin: "var(--space-md) 0 0 0", maxWidth: "680px" }}>
                            {vm.chrome.step4GeodeticMethod}
                        </p>
                    )}
                    <p style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6rem",
                        letterSpacing: "0.08em",
                        color: "var(--text-tertiary)",
                        margin: "var(--space-md) 0 0 0",
                    }}>
                        Birth: {birthIso?.slice(0, 10) ?? "—"} · Destination: {city} ({lat.toFixed(2)}°, {lon.toFixed(2)}°)
                    </p>
                </DetailsBlock>
            </div>
        </TabSection>
    );
}

// ── Personalised opener (editorial drop-cap lede) ────────────────────────

interface TimingState {
    skyHasContent: boolean;     // active transits OR eclipses OR lunations within orb
    hasProgressedBand: boolean; // a progressed Sun/Moon band brackets this longitude
}

interface OpenerData {
    lede: string;       // single drop-cap paragraph; never empty
    extraCount: number; // 0..N — how many close hits we didn't narrate
}

function buildOpener({
    city, cornerRows, timing,
}: {
    city: string;
    cornerRows: Array<{ anchor: Anchor; sign: string; deg: number; hit: PersonalGeodeticHit | undefined }>;
    timing: TimingState;
}): OpenerData {
    const hits = cornerRows
        .filter((r) => r.hit)
        .map((r) => ({
            anchor: r.anchor,
            hit: r.hit as PersonalGeodeticHit,
            weight: familyStoryWeight(r.hit!.family) - r.hit!.orbDeg,
        }))
        .sort((a, b) => b.weight - a.weight);

    if (hits.length === 0) {
        const skyClause = timing.skyHasContent
            ? "Whatever's live in the sky right now passes through unattached."
            : "";
        return {
            lede: `${city} sits as open ground for you. None of your natal planets sit close to its geodetic corners, so no specific life domains get pre-coded by the place. ${skyClause} Bring what you want here — the city won't fight you for the steering wheel.`.replace(/  +/g, " ").trim(),
            extraCount: 0,
        };
    }

    const top = hits.slice(0, 3);
    const lead = top[0];
    const leadLex = PLANET_LEX[lead.hit.planet.toLowerCase()];
    const character = leadLex?.cityCharacter ?? "a quietly distinct field";

    // Timing tail — varies by 1 vs 2-3 hits and by sky state.
    const timingTail = composeTimingTail(top.length, timing);

    // Life-domain summary — names the H1/H10/H7/H4 themes activated.
    const domains = top.map((h) => ANCHOR_DOMAIN[h.anchor]);
    const domainSentence = domainSummary(domains);

    if (top.length === 1) {
        const tail = leadLex?.tail ?? "a single signal at the corners";
        const lede = `${city} runs on your ${capitalize(lead.hit.planet)}. The city becomes ${character} for you — ${tail}. ${domainSentence} ${timingTail}`.trim();
        return { lede, extraCount: Math.max(0, hits.length - 3) };
    }

    // 2 or 3 hits — anchor map + character synthesis + secondary fold-in.
    const anchorMap = top.length === 2
        ? top.map((h) => `${capitalize(h.hit.planet)} on ${ANCHOR_SHORT[h.anchor]}`).join(" and ")
        : top.map((h) => `${capitalize(h.hit.planet)} on ${ANCHOR_SHORT[h.anchor]}`).join(", ");

    const secondaries = top.slice(1).map((h) => {
        const sLex = PLANET_LEX[h.hit.planet.toLowerCase()];
        return `${sLex?.shortFlavour ?? "a secondary current"} at ${ANCHOR_SHORT[h.anchor]}`;
    });
    const folded = secondaries.length === 1
        ? `${secondaries[0]} pressing in`
        : `${secondaries.slice(0, -1).join(", ")} and ${secondaries[secondaries.length - 1]} folding in`;

    const lede = `${anchorMap} — ${city} sets up as ${character} for you, with ${folded}. ${domainSentence} ${timingTail}`.trim();
    return { lede, extraCount: Math.max(0, hits.length - 3) };
}

// Domain-summary helper. dedupes (no anchor repeats but defensive).
function domainSummary(domainsRaw: string[]): string {
    const domains = Array.from(new Set(domainsRaw));
    if (domains.length === 1) return `${capitalize(domains[0])} lights up here.`;
    if (domains.length === 2) return `${capitalize(domains[0])} and ${domains[1]} both light up here.`;
    const head = capitalize(domains[0]);
    const tail = domains[domains.length - 1];
    const middle = domains.slice(1, -1).join(", ");
    return `${head}, ${middle}, and ${tail} all light up here.`;
}

function composeTimingTail(hitCount: number, t: TimingState): string {
    if (t.hasProgressedBand) {
        return hitCount === 1
            ? "A multi-year progression band also runs through this longitude — the alignment is structural, not just a moment."
            : "A multi-year progression band also runs through this longitude on top — the alignment is structural.";
    }
    if (t.skyHasContent) {
        return hitCount === 1
            ? "And the sky's pressing on this corner right now — the place is at full volume."
            : "With the sky also pressing on these corners right now, the place runs hot for you.";
    }
    // Quiet sky.
    return hitCount === 1
        ? "The sky overhead is quiet right now; the place's tone is the whole story."
        : `${hitCount === 3 ? "Three" : "Two"} of your planets are inside the city's corners with a quiet sky overhead — the natal compatibility runs the show.`;
}

// ── Geodetic-frame house interpretations ─────────────────────────────────
//
// The framework's "Interpret the Houses" item asks: which life domains are
// activated when the city's coordinates set the clock, vs the client's natal
// chart? This composer groups the geodetic-frame natal-planet assignments
// by house, looks up each planet's natal house for the diff chip, and
// produces a magazine sentence per loaded house using the same PLANET_LEX
// vocabulary the opener already uses.

interface InterpretationPlanet {
    name: string;            // canonical lower-case
    natalHouse: number | null;
    differs: boolean;        // true when natal house != geodetic house
}

interface GeodeticInterpretation {
    house: number;
    domainShort: string;     // "Career"
    domainFull: string;      // "Career & Reputation"
    planets: InterpretationPlanet[];
    sentence: string;        // composed
}

function buildGeodeticInterpretations(
    assignments: ReadonlyArray<{ planet: string; house: number }>,
    natalPlanets: ReadonlyArray<{ name?: string; planet?: string; house?: number }>,
): GeodeticInterpretation[] {
    const natalHouseMap = new Map<string, number>();
    for (const np of natalPlanets) {
        const name = String((np as any).name ?? (np as any).planet ?? "").toLowerCase();
        const house = typeof np.house === "number" ? np.house : null;
        if (name && house !== null) natalHouseMap.set(name, house);
    }

    const byHouse = new Map<number, InterpretationPlanet[]>();
    for (const a of assignments) {
        const name = a.planet.toLowerCase();
        const natalHouse = natalHouseMap.get(name) ?? null;
        const list = byHouse.get(a.house) ?? [];
        list.push({
            name,
            natalHouse,
            differs: natalHouse !== null && natalHouse !== a.house,
        });
        byHouse.set(a.house, list);
    }

    return [...byHouse.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([house, planets]) => ({
            house,
            domainShort: HOUSE_DOMAIN_SHORT[house] ?? `H${house}`,
            domainFull: HOUSE_THEMES[house] ?? `House ${house}`,
            planets,
            sentence: composeInterpretationSentence(house, planets.map((p) => p.name)),
        }));
}

function composeInterpretationSentence(house: number, planetNames: string[]): string {
    const domain = HOUSE_DOMAIN_SHORT[house] ?? `House ${house}`;
    const lex0 = PLANET_LEX[planetNames[0]];
    const f0 = lex0?.shortFlavour ?? "a quiet signal";
    const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;

    if (planetNames.length === 1) {
        return `${cap(domain)} here: ${cap(planetNames[0])}-coded — ${f0}.`;
    }
    if (planetNames.length === 2) {
        const lex1 = PLANET_LEX[planetNames[1]];
        const f1 = lex1?.shortFlavour ?? "weight";
        return `${cap(domain)} here: ${cap(planetNames[0])}-coded with ${cap(planetNames[1])}'s ${f1} folded in — ${f0} meeting ${f1}.`;
    }
    // 3+ planets: list them, lead with the dominant flavour.
    const allCaps = planetNames.map(cap);
    return `${cap(domain)} here: ${allCaps.slice(0, -1).join(", ")}, and ${allCaps[allCaps.length - 1]} all loaded — ${f0} setting the tone.`;
}

function Opener({ data }: { data: OpenerData }) {
    const FONT_PRIMARY = "var(--font-primary, serif)";
    const FONT_BODY = "var(--font-body, system-ui)";
    const ledeFirst = data.lede.charAt(0);
    const ledeRest = data.lede.slice(1);

    return (
        <section className="m-0 mb-[clamp(20px,2.5vw,32px)] p-0 bg-transparent">
            {/* Drop-cap lede — mirrors OverviewTab editorial paragraph */}
            <div className="relative isolate flex items-start gap-[clamp(14px,2vw,28px)]">
                <span
                    aria-hidden
                    className="shrink-0 leading-[0.85] select-none"
                    style={{
                        fontFamily: FONT_PRIMARY,
                        fontSize: "clamp(72px, 8vw, 112px)",
                        color: "var(--color-y2k-blue)",
                        marginTop: "-0.06em",
                    }}
                >
                    {ledeFirst}
                </span>
                <p
                    className="m-0 max-w-[60ch] [text-wrap:pretty]"
                    style={{
                        fontFamily: FONT_BODY,
                        fontSize: "clamp(17px, 1.4vw, 19px)",
                        lineHeight: 1.7,
                        color: "var(--text-secondary)",
                        fontWeight: 400,
                    }}
                >
                    {ledeRest}
                </p>
            </div>

            {data.extraCount > 0 && (
                <p
                    className="m-0 mt-4 max-w-[60ch]"
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.7rem",
                        letterSpacing: "0.12em",
                        color: "var(--text-tertiary)",
                    }}
                >
                    {data.extraCount === 1
                        ? "One more planet sits close to a corner — see it in the four corners below."
                        : `${data.extraCount} more planets sit close to the corners — see them in the four corners below.`}
                </p>
            )}
        </section>
    );
}

function familyStoryWeight(family: PersonalGeodeticHit["family"]): number {
    // Gives loud "rough" or "bright" a slight edge over "gentle" when picking
    // the lead planet — strong signals make for stronger ledes.
    switch (family) {
        case "rough":   return 6;
        case "bright":  return 5;
        case "gentle":  return 4;
        default:        return 3;
    }
}

// ── Four-corner inline copy (magazine voice, no parentheticals) ──────────

function anchorCopy(anchor: Anchor, sign: string, hit: PersonalGeodeticHit | undefined): string {
    const flavor = SIGN_FLAVOR[sign] ?? "neutral";
    const label = ANCHOR_LABEL[anchor];
    if (!hit) {
        return `${label}: ${flavor}. Nothing close enough to push it further.`;
    }
    const planet = capitalize(hit.planet);
    const verb = PLANET_LEX[hit.planet.toLowerCase()]?.verb ?? "colours";
    return `${label}: ${flavor}. ${planet} ${verb} it.`;
}

// ── What's live now: combine geo-transits + eclipses + lunations ──────────

interface LiveItem {
    kind: "transit" | "eclipse" | "lunation";
    sortKey: number;            // smaller = sooner / more urgent
    when: string;               // "Now" | "Apr 12" | "May 03"
    body: string;               // "Mars" | "Solar eclipse"
    glyph: string;
    aspect: string;             // "conj geo-MC" | "eclipse"
    natalContact: string;       // "natal Sun" or ""
    tone: "lift" | "press" | "push" | "neutral";
    why: string;                // 1-line plain-English read
}

function buildLiveItems(vm: V4VM): LiveItem[] {
    const out: LiveItem[] = [];

    for (const t of vm.geodetic?.activeTransits ?? []) {
        out.push({
            kind: "transit",
            sortKey: t.orb,
            when: "Now",
            body: capitalize(t.planet),
            glyph: planetGlyph(t.planet),
            aspect: `conj geo-${t.angle}`,
            natalContact: t.personalActivation && t.natalContact ? `natal ${capitalize(t.natalContact)}` : "",
            tone: directionToTone(t.direction, t.severity),
            why: liveWhy("transit", t.planet, t.angle, t.natalContact, t.direction),
        });
    }
    for (const e of vm.eclipses?.hits ?? []) {
        out.push({
            kind: "eclipse",
            sortKey: 1000 + e.daysFromTarget,
            when: shortDate(e.dateUtc),
            body: e.kind === "solar" ? "Solar eclipse" : "Lunar eclipse",
            glyph: e.kind === "solar" ? "☉" : "☽",
            aspect: `on geo-${anglePart(e.activatedAngle)}`,
            natalContact: e.natalContact ? `natal ${capitalize(e.natalContact)}` : "",
            tone: "press",
            why: `Eclipses around this longitude tend to expose what's already shaky on your ${anglePart(e.activatedAngle)} corner.`,
        });
    }
    for (const l of vm.lunations?.hits ?? []) {
        out.push({
            kind: "lunation",
            sortKey: 2000 + l.daysFromTarget,
            when: shortDate(l.dateUtc),
            body: l.kind === "new-moon" ? "New moon" : "Full moon",
            glyph: l.kind === "new-moon" ? "🌑" : "🌕",
            aspect: `on geo-${anglePart(l.activatedAngle)}`,
            natalContact: l.natalContact ? `natal ${capitalize(l.natalContact)}` : "",
            tone: l.kind === "new-moon" ? "lift" : "press",
            why: l.kind === "new-moon"
                ? `A fresh-start signature on this longitude — a small opening for your ${anglePart(l.activatedAngle)} corner.`
                : `An exposure signature on this longitude — your ${anglePart(l.activatedAngle)} corner gets honest.`,
        });
    }
    return out.sort((a, b) => a.sortKey - b.sortKey);
}

function shortDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(0, 10);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function anglePart(a: V4EclipseHit["activatedAngle"] | V4LunationHit["activatedAngle"]): string {
    return ({ geoMC: "MC", geoIC: "IC", geoASC: "ASC", geoDSC: "DSC" } as const)[a];
}

function directionToTone(direction: V4GeoTransit["direction"], severity: number): LiveItem["tone"] {
    if (direction === "benefic" || direction === "luminary") return "lift";
    if (direction === "malefic") return severity < -10 ? "press" : "push";
    return "neutral";
}

function liveWhy(_kind: "transit", planet: string, angle: V4GeoTransit["angle"], natalContact: string | undefined, direction: V4GeoTransit["direction"]): string {
    const pm = geodeticPlanetMeaning(capitalize(planet));
    const themeBit = pm ? ` brings ${pm.theme}` : "";
    const angleBit = ANGLE_FRAME[angle].verb;
    const personalBit = natalContact ? ` It also touches your natal ${capitalize(natalContact)} — that doubles the personal weight.` : "";
    const lead = direction === "malefic"
        ? `${capitalize(planet)}${themeBit}, but on this corner it ${angleBit}.`
        : `${capitalize(planet)}${themeBit} and ${angleBit}.`;
    return lead + personalBit;
}

function LiveNowTable({ items }: { items: LiveItem[] }) {
    return (
        <div style={{ borderTop: "1px solid var(--surface-border)" }}>
            <div role="row" style={{
                display: "grid",
                gridTemplateColumns: "minmax(56px, auto) minmax(56px, auto) minmax(140px, 1.5fr) minmax(140px, 1fr) minmax(70px, auto)",
                gap: "0.85rem",
                padding: "0.5rem 0",
                borderBottom: "1px solid var(--surface-border)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.55rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                fontWeight: 700,
            }}>
                <span>When</span><span>Body</span><span>What it does</span><span>Natal contact</span><span style={{ textAlign: "right" }}>Tone</span>
            </div>
            {items.map((item, i) => (
                <LiveRow key={`live-${i}`} item={item} />
            ))}
        </div>
    );
}

function LiveRow({ item }: { item: LiveItem }) {
    const [open, setOpen] = useState(false);
    const tone = toneAccent(item.tone);
    return (
        <div style={{ borderBottom: "1px solid var(--surface-border)" }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    padding: "0.85rem 0",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "var(--text-primary)",
                    display: "grid",
                    gridTemplateColumns: "minmax(56px, auto) minmax(56px, auto) minmax(140px, 1.5fr) minmax(140px, 1fr) minmax(70px, auto)",
                    gap: "0.85rem",
                    alignItems: "baseline",
                }}
            >
                <span style={{ ...MONO_SM, color: "var(--text-tertiary)" }}>{item.when}</span>
                <span style={{ fontFamily: "var(--font-primary)", fontSize: "1.1rem", color: "var(--text-primary)" }}>
                    <span style={{ marginRight: "0.4rem" }}>{item.glyph}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem" }}>{item.body}</span>
                </span>
                <span style={{ ...BODY, fontSize: "0.88rem", color: "var(--text-secondary)" }}>{item.aspect}</span>
                <span style={{ ...BODY_CAPTION, color: item.natalContact ? "var(--text-secondary)" : "var(--text-tertiary)" }}>
                    {item.natalContact || "—"}
                </span>
                <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: tone.fg,
                    border: `1px solid ${tone.fg}`,
                    background: tone.bg,
                    padding: "0.2rem 0.55rem",
                    borderRadius: "999px",
                    textAlign: "center",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    justifySelf: "end",
                }}>
                    {item.tone}
                </span>
            </button>
            {open && (
                <p style={{ ...BODY, fontSize: "0.92rem", margin: "0 0 0.85rem 0", paddingLeft: "5rem", maxWidth: "640px" }}>
                    {item.why}
                </p>
            )}
        </div>
    );
}

function toneAccent(tone: LiveItem["tone"]): { fg: string; bg: string } {
    if (tone === "lift")    return { fg: "var(--sage, #4a8a6a)", bg: "color-mix(in oklab, var(--sage, #4a8a6a) 8%, transparent)" };
    if (tone === "press")   return { fg: "var(--color-spiced-life)", bg: "color-mix(in oklab, var(--color-spiced-life) 8%, transparent)" };
    if (tone === "push")    return { fg: "var(--gold)", bg: "color-mix(in oklab, var(--gold) 10%, transparent)" };
    return { fg: "var(--text-tertiary)", bg: "transparent" };
}

// ── Progressions one-liner (promoted out of details) ─────────────────────

function ProgressionsLine({ bands }: { bands: V4ProgressedBand[] }) {
    const inBand = bands.find((b) => b.destinationInBand);
    if (!inBand) return null;
    return (
        <p style={{
            ...BODY,
            fontSize: "0.92rem",
            margin: "0 0 var(--space-md) 0",
            padding: "0.65rem 0.9rem",
            background: "color-mix(in oklab, var(--gold) 5%, transparent)",
            border: "1px solid color-mix(in oklab, var(--gold) 30%, var(--surface-border))",
            borderRadius: "var(--radius-sm)",
            maxWidth: "640px",
        }}>
            <span style={{ ...MONO_SM, color: "var(--gold)", marginRight: "0.6rem" }}>Progression</span>
            Your progressed {inBand.planet} sits in {inBand.sign} ({inBand.longitudeRange}). This longitude
            falls inside that band — the alignment is multi-year, not just today.
        </p>
    );
}

// ── Contact table ─────────────────────────────────────────────────────────

function ContactTable({
    rows, notes,
}: {
    rows: { row: { anchor: Anchor }; hit: PersonalGeodeticHit }[];
    notes: Map<string, string>;
}) {
    const [open, setOpen] = useState<string | null>(null);

    return (
        <div>
            {rows.map(({ row, hit }, i) => {
                const id  = `${hit.planet}-${row.anchor}`;
                const isOpen = open === id;
                const accent = familyAccent(hit.family);
                const note = notes.get(`${hit.planet.toLowerCase()}-${row.anchor}`)
                    || fallbackHitNote(hit, ANGLE_TOPIC[row.anchor]);

                return (
                    <div key={id} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                        <button
                            onClick={() => setOpen(isOpen ? null : id)}
                            style={{
                                width:      "100%",
                                display:    "flex",
                                alignItems: "center",
                                gap:        "1rem",
                                padding:    "1.25rem 0",
                                background: "transparent",
                                border:     "none",
                                cursor:     "pointer",
                                textAlign:  "left",
                                color:      "var(--text-primary)",
                            }}
                        >
                            <span style={{
                                fontFamily:    "var(--font-mono)",
                                fontSize:      "0.7rem",
                                color:         "var(--text-tertiary)",
                                minWidth:      "2rem",
                                fontVariantNumeric: "tabular-nums",
                            }}>
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <div style={{ flex: 1 }}>
                                <span style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize:   "0.9rem",
                                    fontWeight: 600,
                                    color:      "var(--text-primary)",
                                }}>
                                    {capitalize(hit.planet)}
                                </span>
                            </div>
                            <div style={{
                                fontFamily: "var(--font-mono)",
                                fontSize:   "0.75rem",
                                color:      "var(--text-tertiary)",
                                textAlign:  "right",
                                display:    "flex",
                                gap:        "0.5rem",
                                alignItems: "center",
                            }}>
                                <span style={{ color: accent }}>{row.anchor}</span>
                                <span style={{ opacity: 0.3 }}>·</span>
                                <span>{hit.orbDeg}°</span>
                                <span style={{ opacity: 0.3 }}>·</span>
                                <span>{hit.closeness}</span>
                            </div>
                            <span style={{
                                fontFamily: "var(--font-mono)",
                                fontSize:   "0.7rem",
                                color:      "var(--text-tertiary)",
                                marginLeft: "0.5rem",
                                transition: "transform 0.2s",
                                display:    "inline-block",
                                transform:  isOpen ? "rotate(180deg)" : "none",
                            }}>
                                ▾
                            </span>
                        </button>

                        {isOpen && (
                            <div style={{ padding: "0 0 1.75rem 3rem", maxWidth: "720px" }}>
                                <p style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize:   "1rem",
                                    lineHeight: 1.6,
                                    color:      "var(--text-primary)",
                                    margin:     "0 0 0.5rem 0",
                                }}>
                                    {note}
                                </p>
                                <div style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize:   "0.82rem",
                                    lineHeight: 1.5,
                                    color:      "var(--text-tertiary)",
                                    fontStyle:  "italic",
                                }}>
                                    {ANGLE_FULL[row.anchor]} — {ANGLE_DESC[row.anchor]}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── ParanList ─────────────────────────────────────────────────────────────

function ParanList({ parans, city }: { parans: V4Paran[]; city: string }) {
    return (
        <div>
            <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.88rem",
                lineHeight: 1.6,
                color: "var(--text-secondary)",
                margin: "0 0 var(--space-md) 0",
                maxWidth: "640px",
                fontWeight: 300,
            }}>
                These pairs cross the horizon together at a latitude near {city}&rsquo;s.
                Tight benefic combinations lift the field; tight malefic combinations
                press it.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {parans.map((p, i) => {
                    const tone = p.contribution > 0
                        ? "var(--sage, #4a8a6a)"
                        : p.contribution < 0
                            ? "var(--color-spiced-life)"
                            : "var(--text-tertiary)";
                    const offset = Math.abs(p.latOffset).toFixed(1);
                    const direction = p.latOffset > 0 ? "north" : "south";
                    return (
                        <li
                            key={`paran-${i}`}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(180px, 1fr) auto auto",
                                gap: "1rem",
                                alignItems: "baseline",
                                padding: "0.85rem 0",
                                borderBottom: "1px solid var(--surface-border)",
                            }}
                        >
                            <div>
                                <div style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                }}>
                                    {capitalize(p.p1)} {p.aspect ? `· ${p.aspect}` : ""} · {capitalize(p.p2)}
                                </div>
                                {p.type && (
                                    <div style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.6rem",
                                        letterSpacing: "0.12em",
                                        textTransform: "uppercase",
                                        color: "var(--text-tertiary)",
                                        marginTop: "0.2rem",
                                    }}>
                                        {p.type}
                                    </div>
                                )}
                            </div>
                            <div style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.7rem",
                                color: "var(--text-secondary)",
                                whiteSpace: "nowrap",
                            }}>
                                {offset}° {direction} of you
                            </div>
                            <span style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                color: tone,
                                padding: "0.25rem 0.6rem",
                                border: `1px solid ${tone}`,
                                borderRadius: "999px",
                                background: `color-mix(in oklab, ${tone} 8%, transparent)`,
                                whiteSpace: "nowrap",
                            }}>
                                {p.contribution > 0 ? "+" : ""}{Math.round(p.contribution)}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

// ── CornerKey ─────────────────────────────────────────────────────────────

function CornerKey() {
    return (
        <div style={{
            display:       "flex",
            flexWrap:      "wrap",
            gap:           "0.75rem 1.5rem",
            marginTop:     "1rem",
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.55rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color:         "var(--text-tertiary)",
        }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ display: "inline-block", width: 14, height: 2, background: "var(--gold)" }} />
                Primary (ASC, MC)
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ display: "inline-block", width: 14, height: 2, background: "var(--text-secondary)", opacity: 0.4 }} />
                Secondary (DSC, IC)
            </span>
        </div>
    );
}

// ── DetailsBlock ──────────────────────────────────────────────────────────

function DetailsBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <details style={{
            background:   "var(--surface)",
            border:       "1px solid var(--surface-border)",
            borderRadius: "var(--radius-md)",
        }}>
            <summary style={{
                padding:       "1.1rem 1.25rem",
                fontFamily:    "var(--font-mono)",
                fontSize:      "0.65rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color:         "var(--text-secondary)",
                cursor:        "pointer",
                display:       "flex",
                alignItems:    "center",
                gap:           "0.75rem",
                listStyle:     "none",
            }}>
                <span style={{ color: "var(--text-tertiary)", fontSize: "0.8rem" }}>+</span>
                {title}
            </summary>
            <div style={{ padding: "0 1.25rem 1.25rem" }}>
                {children}
            </div>
        </details>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function familyAccent(family: PersonalGeodeticHit["family"]): string {
    switch (family) {
        case "gentle": return "var(--sage)";
        case "rough":  return "var(--color-spiced-life)";
        case "bright": return "var(--gold)";
        default:       return "var(--text-tertiary)";
    }
}

function planetGlyph(planet: string): string {
    const G: Record<string, string> = {
        sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
        jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
        chiron: "⚷", "true node": "☊", "north node": "☊",
    };
    return G[planet.toLowerCase()] ?? "•";
}

function extractGeodeticHitNotes(reading: any): Map<string, string> {
    const out = new Map<string, string>();
    const raw = reading?.teacherReading?.geodeticHits;
    if (!Array.isArray(raw)) return out;
    for (const entry of raw) {
        if (typeof entry?.hitKey === "string" && typeof entry?.note === "string") {
            out.set(entry.hitKey.toLowerCase(), entry.note);
        }
    }
    return out;
}

function fallbackHitNote(hit: PersonalGeodeticHit, topic: string): string {
    const proximity = hit.closeness === "very close" ? "right on" : "close to";
    const feel =
        hit.family === "gentle" ? "Things here may feel easier and warmer." :
        hit.family === "rough"  ? "Things here may feel harder and more pushy." :
        hit.family === "bright" ? "Things here may stand out more than usual." :
                                  "Things here pick up a mild flavor from this planet.";
    return `${capitalize(hit.planet)} sits ${proximity} your ${topic} corner. ${feel}`;
}

function capitalize(s: string): string {
    return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}
