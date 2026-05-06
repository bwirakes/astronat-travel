import type { CouplesVM } from "@/app/lib/couples-viewmodel";
import type { TransitHit } from "@/lib/astro/transit-solver";
import { signFromLongitude } from "@/app/lib/geodetic";
import { formatTransitDates, transitTone, aspectSentence } from "./ai-input-helpers";

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
}

function buildEditorialSpine(vm: CouplesVM): CouplesEditorialSpine {
    const { destination, partnerName, joint, deltaPts } = vm.hero;
    const { you, partner } = vm.ledger;
    const goals = vm.intro.goals.join(" and ");
    const goalLabel = goals || "shared goals";

    const youSummary = `you ${you.score}/100 (${you.label.toLowerCase()})`;
    const partnerSummary = `${partnerName} ${partner.score}/100 (${partner.label.toLowerCase()})`;

    const thesis = `${destination} is a ${joint.label.toLowerCase()} for two with ${goalLabel} — joint ${joint.score}/100, ${youSummary}, ${partnerSummary}.`;

    const primaryQuestion = `Where does ${destination} pull ${partnerName} and you together, and where does it pull you apart?`;

    let throughline: string;
    if (deltaPts >= 25) {
        throughline = `Polarised pair: scores diverge by ${deltaPts} points. Lead §02 and §04 with the gap; surface who feels which side of the city.`;
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
    };
}
