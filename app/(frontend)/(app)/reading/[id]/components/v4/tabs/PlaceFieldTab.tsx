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
import SectionHead from "../../shared/SectionHead";
import TabSection from "../../shared/TabSection";
import { mergeGuideRows } from "../../shared/ReadingCopy";
import UniversalSkySection from "./UniversalSkySection";
import type { V4VM } from "./types";

interface Props {
    vm: V4VM;
    isDark: boolean;
    birthIso: string | undefined;
    reading: any;
    relocatedAcgLines: any[];
    natalForMap?: unknown;
    copiedTab?: {
        lead?: string;
        plainEnglishSummary?: string;
        guideRows?: Array<{ label: string; body: string }>;
        evidenceCaption?: string;
        nextTabBridge?: string;
    };
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

const MAP_PANEL: React.CSSProperties = {
    background: "transparent",
    padding: 0,
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

export default function PlaceFieldTab({ vm, isDark, birthIso, reading, relocatedAcgLines, copiedTab }: Props) {
    const { lat, lon, city } = vm.location;
    const [showMapParans, setShowMapParans] = useState(true);
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
    const liveEventItems = liveItems.filter((item) => item.kind !== "transit");
    const activeGeoTransits = [...(vm.geodetic?.activeTransits ?? [])]
        .sort((a, b) => Math.abs(b.severity) - Math.abs(a.severity));
    const hasLiveSupport =
        activeGeoTransits.length > 0 ||
        liveEventItems.length > 0 ||
        (vm.geodetic?.liveLines.length ?? 0) > 0 ||
        !!vm.geodetic?.liveLinesLead ||
        !!vm.progressions?.bands.some((b) => b.destinationInBand);
    const timing: TimingState = {
        skyHasContent: liveItems.length > 0,
        hasProgressedBand: vm.progressions?.bands.some((b) => b.destinationInBand) ?? false,
    };
    const opener = buildOpener({ city, cornerRows, timing });
    const interpretations = buildGeodeticInterpretations(
        vm.geodeticHouseFrame.natalAssignments,
        reading?.natalPlanets ?? [],
        vm.scoreNarrative.selectedGoals[0],
    );

    const tabLead = copiedTab?.lead?.trim() || "";
    const tabIntro = copiedTab?.plainEnglishSummary || undefined;
    const hasAiCopy = tabLead.length > 0 || !!tabIntro;
    const hasHouseFrame = vm.geodeticHouseFrame.cusps.length === 12;
    const hasLifeAreas = interpretations.length > 0;
    const optionalSectionStart = 4;
    const universalSkyIndex = optionalSectionStart;
    const houseFrameIndex = optionalSectionStart + (vm.universalSky ? 1 : 0);
    const lifeAreasIndex = houseFrameIndex + (hasHouseFrame ? 1 : 0);
    const geographyGuideRows = mergeGuideRows(copiedTab?.guideRows, buildCityUseGuideRows({
        city,
        selectedGoal: vm.scoreNarrative.selectedGoals[0],
        cornerRows,
        liveItem: liveItems[0],
    }))?.map((row) => {
        if (row.label === "Best Used For") return { ...row, label: "Use this for", badgeVariant: "overview-use" as const };
        if (row.label === "Move Carefully With") return { ...row, label: "Don't use this for", badgeVariant: "overview-avoid" as const };
        return { ...row, label: "Look here first", badgeVariant: "overview-next" as const };
    });

    return (
        <TabSection
            kicker="Geography"
            title={`${city} · City compatibility (geodetic)`}
            lead={tabLead}
            intro={tabIntro}
            guideRows={geographyGuideRows}
            maxSentences={5}
            quietCopy
            preserveGuideLabels
            guideLayout="flow"
            guideFlowVariant="overview"
            guideSurface="cards"
        >
            {/* ── Personalised opener — only shown when no AI dek/intro exists ── */}
            {!hasAiCopy && (
                <>
                    <Opener data={opener} />
                    <div style={{ ...DIVIDER, margin: "var(--space-lg) 0" }} />
                </>
            )}

            {/* ── §01 City/paran map ─────────────────────────────────── */}
            <SectionHead index="01" title={`Where ${city} sits on the geodetic map`}  flush />
            <div className="reading-card reading-card--strong" style={{ ...MAP_PANEL, maxWidth: "760px", marginBottom: "var(--space-md)", padding: "clamp(1rem, 2vw, 1.35rem)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={KICKER}>City + paran field</div>
                    <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.58rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--text-tertiary)",
                        padding: 0,
                        background: "transparent",
                        whiteSpace: "nowrap",
                    }}>
                        Earth-fixed
                    </span>
                </div>
                <ReadingGeodeticMap
                    lat={lat}
                    lon={lon}
                    city={city}
                    parans={vm.parans}
                    showParans={showMapParans}
                    onToggleParans={vm.parans.length > 0 ? () => setShowMapParans((v) => !v) : undefined}
                    paransCount={vm.parans.length}
                />
                <p style={{ ...BODY_CAPTION, margin: "0.75rem 0 0 0", maxWidth: "640px" }}>
                    This is the city layer: the pin is {city}, and the dashed paran latitudes show crossings that color the place before your natal chart is overlaid.
                </p>
            </div>
            <CityFieldReceipts
                cornerRows={cornerRows}
                parans={vm.parans}
                paranNotes={paranNotesByKey(vm.geodetic?.placeCharacter?.parans)}
            />

            <div style={{ ...DIVIDER, margin: "var(--space-xl) 0 var(--space-lg)" }} />

            {/* ── §02 What this place activates ────────────────────────── */}
            <SectionHead index="02" title={`What ${city} activates in your chart`}  flush />
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
                    gap: "clamp(1.5rem, 4vw, 2.5rem)",
                    alignItems: "start",
                    marginBottom: "var(--space-md)",
                }}
            >
                <div>
                    <div style={KICKER}>The four corners</div>
                    <CornerFlow rows={cornerRows} />
                </div>

                <div style={{
                    borderTop: "1px solid var(--surface-border)",
                    paddingTop: "clamp(2.2rem, 5vw, 3.6rem)",
                    marginTop: "clamp(2rem, 5vw, 3.5rem)",
                }}>
                    <div style={KICKER}>Natal × geodetic overlay</div>
                    <p style={{ ...BODY_CAPTION, margin: "0 0 var(--space-md) 0", maxWidth: "34rem" }}>
                        The wheel below places those four city corners against your natal planets, so the flow above has a chart receipt beside it.
                    </p>
                    <div style={{ width: "100%", maxWidth: "520px", margin: "0 auto", position: "relative" }}>
                        <NatalWithGeodeticOverlay
                            isDark={isDark}
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

            {/* ── §03 What's live now (promoted out of details) ───────── */}
            <SectionHead index="03" title={`What's live in ${city} now`}  flush />
            {vm.geodetic?.liveLinesLead && (
                <p style={{ ...BODY, fontSize: "1.05rem", margin: "0 0 var(--space-md) 0", maxWidth: "640px" }}>
                    {vm.geodetic.liveLinesLead}
                </p>
            )}
            {activeGeoTransits.length > 0 && (
                <ActiveGeoTransits city={city} transits={activeGeoTransits} />
            )}
            {vm.progressions && (
                <ProgressionsLine bands={vm.progressions.bands} />
            )}
            {(vm.geodetic?.liveLines.length ?? 0) > 0 && (
                <LiveLinesList lines={vm.geodetic!.liveLines} />
            )}
            {liveEventItems.length > 0 ? (
                <LiveNowTable items={liveEventItems} title="Other dated triggers" />
            ) : hasLiveSupport ? null : reading?.geodeticEngineVersion ? (
                <p style={BODY_MUTED}>
                    The sky over {city} is quiet right now &mdash; nothing transiting close to its corners.
                </p>
            ) : (
                <p style={BODY_MUTED}>
                    Live transit data wasn&rsquo;t computed for this reading. Generate a fresh
                    reading to see what&rsquo;s lighting {city}&rsquo;s corners now.
                </p>
            )}

            {(vm.universalSky || hasHouseFrame || hasLifeAreas) && (
                <div style={{ ...DIVIDER, margin: "var(--space-xl) 0 var(--space-lg)" }} />
            )}

            {/* ── Universal sky weather (location-agnostic) ───────────── */}
            {vm.universalSky && (
                <UniversalSkySection
                    sky={vm.universalSky}
                    sectionIndex={String(universalSkyIndex).padStart(2, "0")}
                    goalIds={vm.goalIds ?? []}
                    travelStartISO={vm.travelDateISO ?? undefined}
                    travelEndISO={
                        vm.travelDateISO
                            ? new Date(
                                  new Date(`${vm.travelDateISO.slice(0, 10)}T00:00:00Z`).getTime()
                                      + (vm.travelType === "relocation" ? 365 : 7) * 86_400_000,
                              )
                                  .toISOString()
                                  .slice(0, 10)
                            : undefined
                    }
                />
            )}

            {/* ── The frame (geodetic house wheel) ────────────────────── */}
            {hasHouseFrame && (
                <>
                    <SectionHead index={String(houseFrameIndex).padStart(2, "0")} title="Where your chart lands on this longitude"  flush />
                    <p style={BODY}>
                        If you swapped your birthplace&rsquo;s clock for {city}&rsquo;s, your natal
                        planets would re-house themselves like this. House 1 starts at the sign of
                        the geodetic Ascendant.
                    </p>
                    <div style={{ width: "100%", maxWidth: "440px", margin: "var(--space-md) auto 0" }}>
                        <GeodeticHouseWheel
                            isDark={isDark}
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

            {/* ── Life areas through the city's geodetic frame ────────── */}
            {hasLifeAreas && (
                <>
                    <SectionHead index={String(lifeAreasIndex).padStart(2, "0")} title={`Life areas through ${city}'s geodetic frame`}  flush />
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
                                                    border: "1px solid var(--surface-border)",
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
    selectedGoal?: { goalId: string; label: string; score: number; action: string } | undefined,
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
            sentence: composeInterpretationSentence(house, planets.map((p) => p.name), selectedGoal),
        }));
}

function composeInterpretationSentence(
    house: number,
    planetNames: string[],
    selectedGoal?: { goalId: string; label: string; score: number; action: string } | undefined,
): string {
    const domain = HOUSE_DOMAIN_SHORT[house] ?? `House ${house}`;
    const domainLong = HOUSE_THEMES[house] ?? `House ${house}`;
    const lex0 = PLANET_LEX[planetNames[0]];
    const f0 = lex0?.shortFlavour ?? "a quiet signal";
    const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
    const action = planetAction(planetNames[0]);
    const goal = goalClause(house, selectedGoal);

    if (planetNames.length === 1) {
        return `${cap(planetNames[0])} loads ${domain.toLowerCase()} here, so ${action} shows up through ${domainLong.toLowerCase()}. ${goal}`;
    }
    if (planetNames.length === 2) {
        const lex1 = PLANET_LEX[planetNames[1]];
        const f1 = lex1?.shortFlavour ?? "weight";
        return `${cap(domain)} is busy here: ${cap(planetNames[0])} brings ${f0}, while ${cap(planetNames[1])} adds ${f1}. Use this house for concrete choices, not vague mood-reading. ${goal}`;
    }
    // 3+ planets: list them, lead with the dominant flavour.
    const allCaps = planetNames.map(cap);
    return `${cap(domain)} is one of the loud rooms here: ${allCaps.slice(0, -1).join(", ")}, and ${allCaps[allCaps.length - 1]} all pile into ${domainLong.toLowerCase()}. Start with ${planetAction(planetNames[0])}; that sets the tone. ${goal}`;
}

function planetAction(planetName: string): string {
    switch (planetName.toLowerCase()) {
        case "sun": return "visibility and self-direction";
        case "moon": return "mood, rest, and emotional safety";
        case "mercury": return "talking, planning, and daily messages";
        case "venus": return "connection, pleasure, and money choices";
        case "mars": return "action, urgency, anger, and effort";
        case "jupiter": return "growth, faith, learning, and appetite";
        case "saturn": return "limits, duty, patience, and pressure";
        case "uranus": return "change, freedom, and disruption";
        case "neptune": return "dreams, fog, art, and porous boundaries";
        case "pluto": return "power, intensity, and deeper control issues";
        default: return `${planetName} themes`;
    }
}

const GOAL_HOUSES: Record<string, number[]> = {
    identity: [1, 9],
    wealth: [2, 8],
    home: [4],
    romance: [5, 7],
    health: [6, 12],
    partnerships: [7, 11],
    friendship: [11, 3],
    spirituality: [12, 9],
    love: [5, 7],
    career: [10, 6, 2],
    community: [11, 3],
    growth: [9, 12],
    relocation: [4],
};

function goalClause(
    house: number,
    selectedGoal?: { goalId: string; label: string; score: number; action: string } | undefined,
): string {
    if (!selectedGoal) return "The useful question is what this makes easier or harder in ordinary life.";
    const relevant = GOAL_HOUSES[selectedGoal.goalId]?.includes(house);
    if (relevant) {
        return `This directly touches your ${selectedGoal.label.toLowerCase()} goal, so ${selectedGoal.action}.`;
    }
    return `For your ${selectedGoal.label.toLowerCase()} goal, treat this as context rather than the main event.`;
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
        return `${sign} makes the ${label.toLowerCase()} feel ${flavor}. This corner is clean, so the sign leads without a loud natal planet taking over.`;
    }
    const planet = capitalize(hit.planet);
    const topic = ANGLE_TOPIC[anchor];
    return `${planet} sits close to the ${label.toLowerCase()} corner, so ${topic} themes get louder here. ${sign} sets the style: ${flavor}.`;
}

function CornerFlow({
    rows,
}: {
    rows: Array<{ anchor: Anchor; sign: string; deg: number; hit: PersonalGeodeticHit | undefined }>;
}) {
    return (
        <div className="reading-card reading-card--accent" role="list" style={{
            listStyle: "none",
            margin: "0.15rem 0 0 0",
            padding: "clamp(1rem, 2vw, 1.3rem)",
            position: "relative",
        }}>
            <span
                aria-hidden
                style={{
                    position: "absolute",
                    left: 27,
                    top: 30,
                    bottom: 28,
                    width: 1,
                    background: "linear-gradient(180deg, color-mix(in oklab, var(--text-tertiary) 18%, transparent), color-mix(in oklab, var(--color-y2k-blue) 18%, transparent), transparent)",
                }}
            />
            {rows.map((row, index) => (
                <CornerFlowRow key={row.anchor} row={row} isLast={index === rows.length - 1} />
            ))}
        </div>
    );
}

function CornerFlowRow({
    row,
    isLast,
}: {
    row: { anchor: Anchor; sign: string; deg: number; hit: PersonalGeodeticHit | undefined };
    isLast: boolean;
}) {
    const { anchor, sign, deg, hit } = row;
    const accent = cornerAccent(anchor, hit);
    const receipt = hit
        ? `geo-${anchor} · ${sign} ${deg}° · ${capitalize(hit.planet)} ${hit.orbDeg}°`
        : `geo-${anchor} · ${sign} ${deg}°`;
    return (
        <div
            role="listitem"
            style={{
                display: "grid",
                gridTemplateColumns: "68px minmax(0, 1fr)",
                gap: "clamp(1rem, 2.4vw, 1.35rem)",
                position: "relative",
                padding: isLast ? "0.45rem 0 0 0" : "0.45rem 0 clamp(1.4rem, 3vw, 2rem)",
            }}
        >
            <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center" }}>
                <CornerBadge anchor={anchor} sign={sign} hit={hit} />
            </div>
            <div
                style={{
                    borderBottom: isLast ? "none" : "1px solid var(--surface-border)",
                    paddingBottom: isLast ? 0 : "clamp(1.15rem, 2.4vw, 1.55rem)",
                    minWidth: 0,
                }}
            >
                <div style={{
                    ...MONO_SM,
                    color: accent,
                    marginBottom: "0.55rem",
                    letterSpacing: "0.22em",
                }}>
                    {anchor} · {ANGLE_FULL[anchor]}
                </div>
                <p style={{
                    ...BODY,
                    color: "var(--text-primary)",
                    margin: 0,
                    fontSize: "clamp(1.05rem, 2.2vw, 1.35rem)",
                    lineHeight: 1.45,
                    maxWidth: "32rem",
                }}>
                    {anchorCopy(anchor, sign, hit)}
                </p>
                <div style={{
                    ...MONO_SM,
                    color: "var(--text-tertiary)",
                    marginTop: "0.65rem",
                    fontSize: "0.55rem",
                    letterSpacing: "0.14em",
                }}>
                    {receipt}
                </div>
            </div>
        </div>
    );
}

function CornerBadge({
    anchor,
    sign,
    hit,
}: {
    anchor: Anchor;
    sign: string;
    hit: PersonalGeodeticHit | undefined;
}) {
    const tone = cornerAccent(anchor, hit);
    const bg = `color-mix(in oklab, ${tone} ${hit ? 15 : 10}%, transparent)`;
    return (
        <span
            aria-hidden
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: "var(--shape-organic-1)",
                color: tone,
                background: bg,
                overflow: "hidden",
                boxShadow: hit ? `0 12px 28px color-mix(in oklab, ${tone} 12%, transparent)` : "none",
            }}
        >
            {hit ? <PlanetGlyphSvg planet={hit.planet} /> : <ZodiacGlyphSvg sign={sign} />}
        </span>
    );
}

function PlanetGlyphSvg({ planet }: { planet: string }) {
    const key = planet.toLowerCase();
    return (
        <svg viewBox="0 0 56 56" width="42" height="42" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {key === "sun" ? (
                <>
                    <circle cx="28" cy="28" r="12" strokeWidth="2" />
                    <circle cx="28" cy="28" r="2.5" fill="currentColor" stroke="none" />
                </>
            ) : key === "moon" ? (
                <path d="M34 13c-8 2-13 8.5-13 16.2 0 6.5 4 11.8 10.5 13.8-9.7-.4-17.5-7-17.5-15.3C14 18.8 22.6 12.5 34 13Z" fill="currentColor" opacity="0.86" stroke="none" />
            ) : key === "mercury" ? (
                <>
                    <path d="M20 14c2.2 4 13.8 4 16 0" strokeWidth="2" />
                    <circle cx="28" cy="27" r="8" strokeWidth="2" />
                    <path d="M28 35v10M22.5 41h11" strokeWidth="2" />
                </>
            ) : key === "venus" ? (
                <>
                    <circle cx="28" cy="22" r="9" strokeWidth="2" />
                    <path d="M28 31v14M21.5 38h13" strokeWidth="2" />
                </>
            ) : key === "mars" ? (
                <>
                    <circle cx="23" cy="32" r="9" strokeWidth="2" />
                    <path d="M30 25l12-12M35 13h7v7" strokeWidth="2" />
                </>
            ) : key === "jupiter" ? (
                <>
                    <path d="M17 20c3.2-6.5 14-5.6 10.2 5.5-1.9 5.4-6.1 8.5-11.2 8.5" strokeWidth="2" />
                    <path d="M34 13v31M18 34h24" strokeWidth="2" />
                </>
            ) : key === "saturn" ? (
                <>
                    <path d="M24 12v32M18 19h13" strokeWidth="2" />
                    <path d="M24 29c12-4 17 1 12 8-2.4 3.4-7.2 4.4-11.2 1.7" strokeWidth="2" />
                </>
            ) : key === "uranus" ? (
                <>
                    <circle cx="28" cy="35" r="6" strokeWidth="2" />
                    <path d="M28 12v17M18 15v18M38 15v18M14 20h8M34 20h8" strokeWidth="2" />
                </>
            ) : key === "neptune" ? (
                <>
                    <path d="M16 17c1.6 9 5.6 14 12 14s10.4-5 12-14" strokeWidth="2" />
                    <path d="M28 12v32M21 41h14M16 17l-3 5M16 17l5 3M40 17l3 5M40 17l-5 3" strokeWidth="2" />
                </>
            ) : key === "pluto" ? (
                <>
                    <path d="M19 17c2.5 8 15.5 8 18 0" strokeWidth="2" />
                    <circle cx="28" cy="18" r="5" strokeWidth="2" />
                    <path d="M28 25v19M21 36h14" strokeWidth="2" />
                </>
            ) : (
                <circle cx="28" cy="28" r="10" fill="currentColor" opacity="0.8" stroke="none" />
            )}
        </svg>
    );
}

function ZodiacGlyphSvg({ sign }: { sign: string }) {
    return (
        <svg viewBox="0 0 56 56" width="42" height="42" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {sign === "Aries" ? (
                <path d="M28 42V24c0-9-5.7-14-11.5-10.8C10.7 16.4 11 25 18 29M28 24c0-9 5.7-14 11.5-10.8C45.3 16.4 45 25 38 29" strokeWidth="2" />
            ) : sign === "Taurus" ? (
                <>
                    <circle cx="28" cy="31" r="11" strokeWidth="2" />
                    <path d="M18 14c2 8 18 8 20 0" strokeWidth="2" />
                </>
            ) : sign === "Gemini" ? (
                <>
                    <path d="M18 15c6 2 14 2 20 0M18 41c6-2 14-2 20 0M21 17v22M35 17v22" strokeWidth="2" />
                </>
            ) : sign === "Cancer" ? (
                <>
                    <path d="M39 22c-5-5-17-5-22 1" strokeWidth="2" />
                    <path d="M17 34c5 5 17 5 22-1" strokeWidth="2" />
                    <circle cx="21" cy="25" r="5" strokeWidth="2" />
                    <circle cx="35" cy="31" r="5" strokeWidth="2" />
                </>
            ) : sign === "Leo" ? (
                <path d="M17 36c6 8 15 2 10-8-4-8 1-15 7-13 6 2 6 10 0 12-6 2-7 8-2 12 3 2 7 2 10-1" strokeWidth="2" />
            ) : sign === "Virgo" ? (
                <path d="M14 17v23M22 17v23M30 17v23M30 22c5-8 15-4 11 7-2 5-7 9-11 11M38 34l6 7" strokeWidth="2" />
            ) : sign === "Libra" ? (
                <>
                    <path d="M14 37h28M14 29h10c-2-8 10-8 8 0h10" strokeWidth="2" />
                </>
            ) : sign === "Scorpio" ? (
                <path d="M13 17v23M21 17v23M29 17v23M29 22c5-8 14-4 14 5v11M39 37l4 4 4-4" strokeWidth="2" />
            ) : sign === "Sagittarius" ? (
                <>
                    <path d="M17 39l22-22M29 17h10v10M19 22l15 15" strokeWidth="2" />
                </>
            ) : sign === "Capricorn" ? (
                <path d="M13 17v23M13 20c6-8 12-3 12 6v14M25 31c5-10 17-7 17 2 0 10-14 12-18 4" strokeWidth="2" />
            ) : sign === "Aquarius" ? (
                <>
                    <path d="M13 22l7-5 8 5 8-5 7 5M13 36l7-5 8 5 8-5 7 5" strokeWidth="2" />
                </>
            ) : sign === "Pisces" ? (
                <>
                    <path d="M19 14c7 8 7 20 0 28M37 14c-7 8-7 20 0 28M16 28h24" strokeWidth="2" />
                </>
            ) : (
                <circle cx="28" cy="28" r="10" fill="currentColor" opacity="0.8" stroke="none" />
            )}
        </svg>
    );
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

function buildCityUseGuideRows({
    city,
    selectedGoal,
    cornerRows,
    liveItem,
}: {
    city: string;
    selectedGoal?: { goalId: string; label: string; score: number; action: string } | undefined;
    cornerRows: Array<{ anchor: Anchor; sign: string; deg: number; hit: PersonalGeodeticHit | undefined }>;
    liveItem?: LiveItem;
}) {
    const loudest = cornerRows.find((row) => row.hit);
    const loudAnchor = loudest
        ? `${ANCHOR_LABEL[loudest.anchor].toLowerCase()} themes`
        : "identity, career, partnership, or home-base themes";
    const useLine = selectedGoal
        ? `Use ${city} to make your ${selectedGoal.label.toLowerCase()} goal concrete, especially the agreements, boundaries, and shared expectations that need a real-world mirror.`
        : `Use ${city} to test one concrete life priority, especially where ${loudAnchor} become louder, easier, or less negotiable in real life.`;
    const avoidLine = liveItem?.tone === "press" || liveItem?.tone === "push"
        ? `${city} is not the place to rush the pressured part of the plan; keep commitments smaller while ${liveItem.body} is active.`
        : `${city} is not the place to make every life area perform at once; choose the one priority that actually needs the city.`;
    const nextMove = selectedGoal?.action
        ? `Start with one ${selectedGoal.label.toLowerCase()} move: ${selectedGoal.action}.`
        : `Start with one low-risk city experiment, then watch whether ${loudAnchor} get clearer or noisier.`;

    return [
        {
            label: "Best Used For",
            body: useLine,
        },
        {
            label: "Move Carefully With",
            body: avoidLine,
        },
        {
            label: "Your Next Move",
            body: nextMove,
        },
    ];
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
            aspect: `conj geo-${t.angle} · ${t.orb.toFixed(1)}° orb · H${t.house} ${HOUSE_DOMAIN_SHORT[t.house] ?? ANGLE_TOPIC[t.angle]}`,
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

function ActiveGeoTransits({ city, transits }: { city: string; transits: V4GeoTransit[] }) {
    return (
        <div className="reading-card reading-card--accent" style={{
            maxWidth: "760px",
            margin: "0 0 var(--space-md) 0",
            padding: "clamp(1rem, 2vw, 1.3rem)",
            display: "grid",
            gap: "0.75rem",
        }}>
            <div style={{ ...MONO_SM, color: "var(--color-y2k-blue)", margin: "0 0 0.15rem 0" }}>
                Active geodetic transits
            </div>
            <p style={{ ...BODY_CAPTION, margin: "-0.25rem 0 0.25rem 0", maxWidth: "620px" }}>
                Current planets contacting {city}&rsquo;s fixed geodetic angles. This is a live snapshot, not a dated transit window.
            </p>
            <div>
                {transits.map((transit, index) => (
                    <ActiveGeoTransitRow
                        key={`active-geo-${transit.planet}-${transit.angle}-${transit.house}`}
                        transit={transit}
                        hasTopRule={index > 0}
                    />
                ))}
            </div>
        </div>
    );
}

function ActiveGeoTransitRow({ transit, hasTopRule }: { transit: V4GeoTransit; hasTopRule: boolean }) {
    const tone = toneAccent(directionToTone(transit.direction, transit.severity));
    const houseTopic = HOUSE_DOMAIN_SHORT[transit.house] ?? ANGLE_TOPIC[transit.angle];
    return (
        <div style={{
            borderTop: hasTopRule ? "1px solid var(--surface-border)" : undefined,
            padding: hasTopRule ? "1rem 0 0" : "0.5rem 0 0",
            display: "grid",
            gap: "0.45rem",
        }}>
            <div style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "0.75rem",
                flexWrap: "wrap",
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.55rem",
                    flexWrap: "wrap",
                }}>
                    <span style={{ fontFamily: "var(--font-primary)", fontSize: "1.1rem", color: "var(--text-primary)", fontWeight: 500 }}>
                        {capitalize(transit.planet)}
                    </span>
                    <span style={{ ...MONO_SM, color: tone.fg }}>
                        on geo-{transit.angle}
                    </span>
                </div>
                <span style={{
                    ...MONO_SM,
                    color: tone.fg,
                    border: `1px solid ${tone.fg}`,
                    background: tone.bg,
                    borderRadius: "999px",
                    padding: "0.18rem 0.5rem",
                    whiteSpace: "nowrap",
                }}>
                    {transitToneLabel(transit)}
                </span>
            </div>
            <p style={{ ...BODY_CAPTION, margin: 0, maxWidth: "640px", color: "var(--text-secondary)" }}>
                {activeGeoTransitSentence(transit)}
            </p>
            <div style={{
                display: "flex",
                gap: "0.55rem",
                flexWrap: "wrap",
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
            }}>
                <span>{transit.orb.toFixed(1)}° orb</span>
                <span>H{transit.house} {houseTopic}</span>
                <span>severity {Math.round(transit.severity)}</span>
                {transit.personalActivation && transit.natalContact && (
                    <span style={{ color: tone.fg }}>
                        natal {capitalize(transit.natalContact)}
                        {typeof transit.natalOrb === "number" ? ` · ${transit.natalOrb.toFixed(1)}°` : ""}
                    </span>
                )}
            </div>
        </div>
    );
}

function activeGeoTransitSentence(transit: V4GeoTransit): string {
    const planet = capitalize(transit.planet);
    const angleTopic = ANGLE_TOPIC[transit.angle];
    const houseTopic = HOUSE_DOMAIN_SHORT[transit.house] ?? angleTopic;
    const personal = transit.personalActivation && transit.natalContact
        ? ` It also contacts natal ${capitalize(transit.natalContact)}, so the signal is more personal.`
        : "";
    return `${planet} is ${transit.orb.toFixed(1)}° from geo-${transit.angle}, activating the city's ${angleTopic} corner and routing through H${transit.house} ${houseTopic}.${personal}`;
}

function transitToneLabel(transit: V4GeoTransit): string {
    if (transit.direction === "benefic" || transit.direction === "luminary") return "support";
    if (transit.direction === "malefic") return transit.severity < -10 ? "pressure" : "friction";
    return "neutral";
}

function LiveNowTable({ items, title = "City transit tracker", note }: { items: LiveItem[]; title?: string; note?: string }) {
    return (
        <div className="reading-card reading-card--accent" style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 0,
            maxWidth: "780px",
            margin: "0 0 var(--space-md) 0",
            padding: "clamp(1rem, 2vw, 1.3rem)",
        }}>
            <div style={{
                ...MONO_SM,
                color: "var(--color-y2k-blue)",
                margin: "0 0 0.35rem 0",
            }}>
                {title}
            </div>
            {note && (
                <p style={{ ...BODY_CAPTION, margin: "0 0 0.65rem 0", maxWidth: "620px" }}>
                    {note}
                </p>
            )}
            <div style={{ borderTop: "1px solid var(--surface-border)" }}>
            {items.map((item, i) => (
                <LiveRow key={`live-${i}`} item={item} />
            ))}
            </div>
        </div>
    );
}

function LiveRow({ item }: { item: LiveItem }) {
    const [open, setOpen] = useState(false);
    const tone = toneAccent(item.tone);
    return (
        <div style={{
            borderBottom: "1px solid var(--surface-border)",
            background: open ? tone.bg : "transparent",
        }}>
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
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    gap: "0.75rem",
                    alignItems: "center",
                }}
                aria-expanded={open}
            >
                <span style={{ minWidth: 0 }}>
                    <span style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "0.55rem",
                        flexWrap: "wrap",
                    }}>
                        <span style={{ fontFamily: "var(--font-primary)", fontSize: "1.05rem", color: "var(--text-primary)", fontWeight: 500 }}>
                            <span style={{ color: tone.fg, marginRight: "0.35rem" }}>{item.glyph}</span>
                            {item.body}
                        </span>
                        <span style={{ ...MONO_SM, color: tone.fg }}>
                            {item.when}
                        </span>
                    </span>
                    <span style={{ ...BODY_CAPTION, display: "block", marginTop: "0.2rem", color: "var(--text-secondary)" }}>
                        {item.aspect}{item.natalContact ? ` · ${item.natalContact}` : ""}
                    </span>
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
                <p style={{ ...BODY, fontSize: "0.92rem", margin: "0 0 0.9rem 0", maxWidth: "640px" }}>
                    {item.why}
                </p>
            )}
        </div>
    );
}

function toneAccent(tone: LiveItem["tone"]): { fg: string; bg: string } {
    if (tone === "lift")    return { fg: "var(--color-y2k-blue)", bg: "color-mix(in oklab, var(--color-y2k-blue) 6%, transparent)" };
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

function ParanList({ parans, notes }: {
    parans: V4Paran[];
    notes?: Map<string, { headline: string; body: string }>;
}) {
    return (
        <div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {parans.map((p, i) => {
                    const tone = p.contribution > 0
                        ? "var(--lift-accent)"
                        : p.contribution < 0
                            ? "var(--color-spiced-life)"
                            : "var(--text-tertiary)";
                    const note = notes?.get(`${p.p1}-${p.p2}`.toLowerCase())
                        ?? notes?.get(`${p.p2}-${p.p1}`.toLowerCase());
                    // 1° latitude orb is the activation threshold — the
                    // pair's combined energy lands at the destination
                    // strongly enough to be felt, not just present.
                    const isActivated = Math.abs(p.latOffset) <= 1;
                    return (
                        <li
                            key={`paran-${i}`}
                            style={{
                                padding: "var(--space-md) 0",
                                borderBottom: "1px solid var(--surface-border)",
                            }}
                        >
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(180px, 1fr) auto",
                                gap: "1rem",
                                alignItems: "baseline",
                            }}>
                                <div>
                                    <div style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.8rem",
                                        fontWeight: 500,
                                        letterSpacing: "0.04em",
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
                                {isActivated && (
                                    <span style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.65rem",
                                        fontWeight: 700,
                                        letterSpacing: "0.14em",
                                        textTransform: "uppercase",
                                        color: tone,
                                        padding: "0.3rem 0.65rem",
                                        border: `1px solid ${tone}`,
                                        borderRadius: "999px",
                                        background: `color-mix(in oklab, ${tone} 8%, transparent)`,
                                        whiteSpace: "nowrap",
                                    }}>
                                        Paran activated
                                    </span>
                                )}
                            </div>
                            {note && (
                                <div style={{ marginTop: "0.6rem", paddingLeft: "0.1rem" }}>
                                    <div style={{
                                        fontFamily: "var(--font-primary, serif)",
                                        fontSize: "1rem",
                                        fontWeight: 600,
                                        color: "var(--text-primary)",
                                        margin: "0 0 0.25rem 0",
                                        textTransform: "none",
                                    }}>
                                        {note.headline}
                                    </div>
                                    <p style={{ ...BODY, margin: 0, fontSize: "0.95rem", maxWidth: "640px" }}>
                                        {note.body}
                                    </p>
                                </div>
                            )}
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
        <details className="reading-card reading-card--accent">
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
        case "gentle": return "var(--lift-accent)";
        case "rough":  return "var(--color-spiced-life)";
        case "bright": return "var(--gold)";
        default:       return "var(--text-tertiary)";
    }
}

function cornerAccent(anchor: Anchor, hit: PersonalGeodeticHit | undefined): string {
    if (hit) {
        const planet = hit.planet.toLowerCase();
        if (planet === "neptune" || planet === "uranus" || planet === "mercury") return "var(--color-y2k-blue)";
        if (planet === "mars" || planet === "saturn" || planet === "pluto") return "var(--color-spiced-life)";
        if (planet === "jupiter" || planet === "moon") return "var(--lift-accent)";
        if (planet === "sun" || planet === "venus") return "var(--gold)";
        return familyAccent(hit.family);
    }
    switch (anchor) {
        case "ASC": return "var(--gold)";
        case "MC":  return "var(--color-y2k-blue)";
        case "DSC": return "var(--color-spiced-life)";
        case "IC":  return "var(--lift-accent)";
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

// ── Teacher-copy renderers (geodetic tab) ─────────────────────────────────

function LiveLinesList({ lines }: { lines: V4VM["geodetic"] extends infer G
    ? G extends { liveLines: infer L } ? L : never : never;
}) {
    if (!lines || lines.length === 0) return null;
    return (
        <ul className="reading-card reading-card--accent" style={{ listStyle: "none", padding: "0 clamp(1rem, 2vw, 1.3rem)", margin: "var(--space-md) 0 0 0" }}>
            {lines.map((l) => (
                <li
                    key={l.liveLineKey}
                    style={{
                        padding: "0.95rem 0",
                        borderBottom: "1px solid var(--surface-border)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.85rem", flexWrap: "wrap" }}>
                        <h3 style={{ ...BODY, fontSize: "1.05rem", fontWeight: 600, margin: 0 }}>
                            {l.headline}
                        </h3>
                        {l.windowNote && (
                            <span style={{ ...MONO_SM, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                                {l.windowNote}
                            </span>
                        )}
                    </div>
                    <p style={{ ...BODY, margin: "0.4rem 0 0 0", maxWidth: "640px" }}>
                        {l.body}
                    </p>
                </li>
            ))}
        </ul>
    );
}

function CityFieldReceipts({
    cornerRows,
    parans,
    paranNotes,
}: {
    cornerRows: Array<{ anchor: Anchor; sign: string; deg: number; hit: PersonalGeodeticHit | undefined }>;
    parans: V4Paran[];
    paranNotes: Map<string, { headline: string; body: string }>;
}) {
    const topParans = [...parans]
        .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
        .slice(0, 3);

    return (
        <section className="reading-card reading-card--accent grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-0 overflow-hidden">
            <article
                className="border-r border-b p-[clamp(20px,3vw,30px)]"
                style={{ borderColor: "var(--surface-border)" }}
            >
                <div style={{ ...MONO_SM, color: "var(--color-y2k-blue)", marginBottom: "0.85rem" }}>
                    City angles
                </div>
                <div
                    className="grid grid-cols-2 gap-2"
                >
                    {cornerRows.map(({ anchor, sign, deg }) => (
                        <div
                            key={`geo-receipt-${anchor}`}
                            className="p-[12px]"
                            style={{
                                border: "1px solid var(--surface-border)",
                                borderRadius: "var(--radius-sm)",
                                background: "transparent",
                            }}
                        >
                            <div className="flex items-baseline justify-between gap-2">
                                <span style={{ ...MONO_SM, color: "var(--text-tertiary)" }}>
                                    geo-{anchor}
                                </span>
                                <span
                                    style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "0.76rem",
                                        color: "var(--text-primary)",
                                        fontWeight: 700,
                                    }}
                                >
                                    {sign} {deg}°
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </article>

            <article
                className="border-r border-b p-[clamp(20px,3vw,30px)]"
                style={{ borderColor: "var(--surface-border)" }}
            >
                <div style={{ ...MONO_SM, color: "var(--color-y2k-blue)", marginBottom: "0.85rem" }}>
                    Paran crossings
                </div>
                {topParans.length ? (
                    <ParanList parans={topParans} notes={paranNotes} />
                ) : (
                    <p style={{ ...BODY_MUTED, margin: 0 }}>
                        No strong paran crossing is close enough to lead this section.
                    </p>
                )}
            </article>
        </section>
    );
}

function paranNotesByKey(notes: ReadonlyArray<{ paranKey: string; headline: string; body: string }> | undefined) {
    const out = new Map<string, { headline: string; body: string }>();
    if (!notes) return out;
    for (const n of notes) {
        if (!n?.paranKey) continue;
        out.set(n.paranKey.toLowerCase(), { headline: n.headline, body: n.body });
    }
    return out;
}
