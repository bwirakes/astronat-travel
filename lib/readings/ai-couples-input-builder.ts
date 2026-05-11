import type { CouplesVM } from "@/app/lib/couples-viewmodel";
import type { TransitHit } from "@/lib/astro/transit-solver";
import { signFromLongitude, houseFromLongitude } from "@/app/lib/geodetic";
import { formatTransitDates, transitTone, aspectSentence } from "./ai-input-helpers";
import { buildChartStructure, type ChartStructure } from "./chart-structure";

/**
 * Joint editorial spine — the single arc the AI writes the whole reading
 * toward. Mirrors the v4 reading's `editorialSpine` (thesis + primaryQuestion
 * + throughline) but adapted for two partners. Derived deterministically
 * from the viewmodel; the AI doesn't compute it.
 */
export interface CouplesEditorialSpine {
    /** One-sentence summary of the joint outcome — names destination, both
     *  partners, joint band, and the dominant goal. The AI uses this as the
     *  shape of `theRead.lead`. */
    thesis: string;
    /** The reader's central question — gives the AI the angle to write
     *  toward in every section. */
    primaryQuestion: string;
    /** Editorial direction: lean into shared peaks if aligned, surface the
     *  gap if polarised. Drives tone in §02 and §04. */
    throughline: string;
}

export interface CouplesReadingInput {
    viewmodel: CouplesVM;
    /** Joint arc — derived from the viewmodel; gives the AI a single
     *  thesis to write toward instead of fishing for one in the data. */
    editorialSpine: CouplesEditorialSpine;
    /**
     * Deterministic ranking profile that governs prose intensity and ordering.
     * The AI should treat this as the scoring source of truth, with rawEvidence
     * used only to explain why those ranked outcomes happen.
     */
    scoreProfile: {
        joint: { score: number; band: string; label: string };
        partnerScores: {
            you: { score: number; band: string; label: string };
            partner: { score: number; band: string; label: string };
            delta: number;
        };
        topEvents: Array<{ event: string; you: number; partner: number }>;
        weakEvents: Array<{
            event: string;
            you: number;
            partner: number;
            joint: number;
            travelRisk: string;
            mitigation: string;
        }>;
        timings: {
            score: number;
            label: string;
            bestWindows: string[];
            avoidWindows: string[];
        };
    };
    rawEvidence: {
        nearbyLinesYou: Array<{ planet: string; angle: string; distanceKm: number }>;
        nearbyLinesPartner: Array<{ planet: string; angle: string; distanceKm: number }>;
        topTransitsYou: Array<{ aspect: string; dateRange: string; tone: string; aspectKey: string; planets: { a: string; b: string } }>;
        topTransitsPartner: Array<{ aspect: string; dateRange: string; tone: string; aspectKey: string; planets: { a: string; b: string } }>;
    };
    /** Per-partner cluster + dispositor + aspect-pattern structure. House
     *  numbers are RELOCATED (anchored to each partner's relocated ASC) so
     *  the prompt's cluster commentary lines up with the rest of the
     *  couples reading. Each side is optional — omitted when that partner's
     *  natal chart has no stelliums and no patterns. */
    chartStructureYou?: ChartStructure;
    chartStructurePartner?: ChartStructure;
}

export function couplesRiskForEvent(event: string): { travelRisk: string; mitigation: string } {
    const key = event.toLowerCase();
    if (key.includes("wealth") || key.includes("financial")) {
        return {
            travelRisk: "money, upgrades, bills, or shared-resource choices can become the fight",
            mitigation: "set the budget and payment rules before either person is tired",
        };
    }
    if (key.includes("home") || key.includes("family")) {
        return {
            travelRisk: "family history, lodging comfort, or private downtime can feel less settled",
            mitigation: "choose calm lodging and avoid making the trip carry family repair work",
        };
    }
    if (key.includes("romance") || key.includes("love")) {
        return {
            travelRisk: "chemistry may not automatically translate into softness or romance",
            mitigation: "plan one low-pressure night and do not choreograph intimacy",
        };
    }
    if (key.includes("health") || key.includes("routine")) {
        return {
            travelRisk: "sleep, pace, meals, and recovery can become the relationship stress point",
            mitigation: "agree on rest windows and food timing before the itinerary gets ambitious",
        };
    }
    if (key.includes("partnership") || key.includes("marriage")) {
        return {
            travelRisk: "commitment expectations and decision rights can tighten fast",
            mitigation: "decide who leads which decisions and where each person gets veto power",
        };
    }
    if (key.includes("career") || key.includes("public")) {
        return {
            travelRisk: "work, status, or public attention can pull focus from the pair",
            mitigation: "separate work obligations from couple time on the calendar",
        };
    }
    if (key.includes("friendship") || key.includes("network")) {
        return {
            travelRisk: "social plans can split the pair or drain one partner faster",
            mitigation: "cap group plans and build a clear exit option",
        };
    }
    if (key.includes("spiritual") || key.includes("inner")) {
        return {
            travelRisk: "quiet meaning-making can turn into withdrawal or misread silence",
            mitigation: "name when solitude is restoration, not rejection",
        };
    }
    return {
        travelRisk: `${event} is a weaker shared use of the destination`,
        mitigation: "keep that domain low-stakes and design around stronger shared events",
    };
}

function buildEditorialSpine(vm: CouplesVM): CouplesEditorialSpine {
    const { destination, partnerName, joint, deltaPts } = vm.hero;
    const { you, partner } = vm.ledger;
    const goals = vm.intro.goals.join(" and ");
    const goalLabel = goals || "shared goals";

    const youSummary = `you read as ${you.label.toLowerCase()}`;
    const partnerSummary = `${partnerName} reads as ${partner.label.toLowerCase()}`;

    const thesis = `${destination} is a ${joint.label.toLowerCase()} match for two with ${goalLabel}: ${youSummary}, while ${partnerSummary}.`;

    const primaryQuestion = `Where does ${destination} pull ${partnerName} and you together, and where does it pull you apart?`;

    let throughline: string;
    if (deltaPts >= 25) {
        throughline = `Polarised pair: the partners experience the city very differently. Lead §02 and §04 with the gap; surface who feels which side of the city.`;
    } else if (joint.band === "peak" || joint.band === "solid") {
        throughline = `Aligned and supportive: lean into the shared peak. Both partners can take this place at face value.`;
    } else if (joint.band === "mixed") {
        throughline = `Mixed for both: there is a real ceiling here. Frame it honestly — neither partner gets a clean win.`;
    } else {
        throughline = `Hard for both: the destination resists the trip. Be specific about which axis fails for each partner.`;
    }

    return { thesis, primaryQuestion, throughline };
}

export function buildCouplesAIInput(args: {
    viewmodel: CouplesVM;
    travelDate: string | null;
    acgLinesYou: any[];
    acgLinesPartner: any[];
    rawTransitsYou: TransitHit[];
    rawTransitsPartner: TransitHit[];
    natalPlanetsYou: any[];
    natalPlanetsPartner: any[];
}): CouplesReadingInput {
    const {
        viewmodel,
        travelDate,
        acgLinesYou,
        acgLinesPartner,
        rawTransitsYou,
        rawTransitsPartner,
        natalPlanetsYou,
        natalPlanetsPartner,
    } = args;

    const refTime = travelDate ? new Date(travelDate).getTime() : Date.now();

    const mapTransits = (transits: TransitHit[], natalPlanets: any[]) => {
        return [...transits]
            .sort((a, b) => {
                const da = Math.abs(new Date(a.date).getTime() - refTime);
                const db = Math.abs(new Date(b.date).getTime() - refTime);
                return da !== db ? da - db : a.orb - b.orb;
            })
            .slice(0, 5)
            .map((hit, i) => {
                const transitNatal = natalPlanets.find(
                    (p) => String(p.name || p.planet).toLowerCase() === hit.transit_planet.toLowerCase(),
                );
                const natalNatal = natalPlanets.find(
                    (p) => String(p.name || p.planet).toLowerCase() === hit.natal_planet.toLowerCase(),
                );
                const transitSign = transitNatal?.sign ?? signFromLongitude(transitNatal?.longitude ?? 0);
                const natalSign = natalNatal?.sign ?? signFromLongitude(natalNatal?.longitude ?? 0);

                const monthKey = (() => {
                    const d = new Date(hit.date);
                    return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
                })();
                const aspectKey = `${monthKey}-${i}-${hit.transit_planet}-${hit.natal_planet}`;

                return {
                    aspect: aspectSentence(hit, transitSign, natalSign),
                    planets: {
                        a: `${hit.transit_planet} in ${transitSign}`,
                        b: `${hit.natal_planet} in ${natalSign}`,
                    },
                    dateRange: formatTransitDates(hit.date),
                    tone: transitTone(hit),
                    aspectKey,
                };
            });
    };

    const topTransitsYou = mapTransits(rawTransitsYou || [], natalPlanetsYou || []);
    const topTransitsPartner = mapTransits(rawTransitsPartner || [], natalPlanetsPartner || []);

    const mapLines = (lines: any[]) => {
        return [...(lines || [])]
            .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity))
            .slice(0, 5)
            .map((l: any) => ({
                planet: l.planet,
                angle: (l.angle || l.line || "").toString().toUpperCase(),
                distanceKm: Math.round(Number(l.distance_km ?? 9999)),
            }));
    };

    const nearbyLinesYou = mapLines(acgLinesYou);
    const nearbyLinesPartner = mapLines(acgLinesPartner);

    // Cluster + dispositor + pattern structure per partner. Each partner's
    // relocated ASC is `viewmodel.deepDive.{you|partner}.cusps[0]`. Omitted
    // when the partner's chart yields no structure to surface.
    const buildPartnerStructure = (
        natalPlanets: any[],
        ascLon: number,
    ): ChartStructure | undefined => {
        const planets = natalPlanets.map((p: any) => ({
            name: p.name ?? p.planet ?? "",
            longitude: p.longitude ?? 0,
            sign: p.sign ?? signFromLongitude(p.longitude ?? 0),
        }));
        const cs = buildChartStructure(planets, (lon: number) => houseFromLongitude(lon, ascLon));
        const has = cs.stelliums.length > 0 || cs.patterns.length > 0 || !!cs.finalDispositor;
        return has ? cs : undefined;
    };
    const youAsc = viewmodel.deepDive.you.cusps[0] ?? 0;
    const partnerAsc = viewmodel.deepDive.partner.cusps[0] ?? 0;
    const chartStructureYou = buildPartnerStructure(natalPlanetsYou ?? [], youAsc);
    const chartStructurePartner = buildPartnerStructure(natalPlanetsPartner ?? [], partnerAsc);

    return {
        viewmodel,
        editorialSpine: buildEditorialSpine(viewmodel),
        scoreProfile: {
            joint: {
                score: viewmodel.hero.joint.score,
                band: viewmodel.hero.joint.band,
                label: viewmodel.hero.joint.label,
            },
            partnerScores: {
                you: {
                    score: viewmodel.ledger.you.score,
                    band: viewmodel.ledger.you.band,
                    label: viewmodel.ledger.you.label,
                },
                partner: {
                    score: viewmodel.ledger.partner.score,
                    band: viewmodel.ledger.partner.band,
                    label: viewmodel.ledger.partner.label,
                },
                delta: viewmodel.ledger.delta,
            },
            topEvents: viewmodel.goals.topThree.map((row) => ({
                event: row.event,
                you: row.you,
                partner: row.partner,
            })),
            weakEvents: [...viewmodel.goals.events]
                .map((row) => ({
                    event: row.event,
                    you: row.you,
                    partner: row.partner,
                    joint: Math.round((row.you + row.partner) / 2),
                    ...couplesRiskForEvent(row.event),
                }))
                .filter((row) => row.joint < 45 || row.you < 40 || row.partner < 40)
                .sort((a, b) => a.joint - b.joint)
                .slice(0, 5),
            timings: {
                score: viewmodel.timings.score,
                label: viewmodel.timings.label,
                bestWindows: [...viewmodel.timings.bestWindows],
                avoidWindows: [...viewmodel.timings.avoidWindows],
            },
        },
        rawEvidence: {
            nearbyLinesYou,
            nearbyLinesPartner,
            topTransitsYou,
            topTransitsPartner,
        },
        ...(chartStructureYou ? { chartStructureYou } : {}),
        ...(chartStructurePartner ? { chartStructurePartner } : {}),
    };
}
