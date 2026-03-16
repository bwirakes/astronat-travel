/**
 * POST /api/summary
 * Returns structured JSON verdict for the destination:
 * overall score, headline synthesis, best/avoid travel windows.
 *
 * The headline is DATE-FIRST: it focuses on what the specific travel date
 * means for the user, which houses are activated, which activities
 * are supported, and what to watch out for.
 */
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-3.1-flash-lite-preview";

function ordinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Map house numbers to life areas */
const HOUSE_THEMES: Record<number, string> = {
    1: "personal identity & first impressions",
    2: "finances & material security",
    3: "communication, short trips & learning",
    4: "home, roots & emotional foundation",
    5: "creativity, romance & pleasure",
    6: "health, daily routines & service",
    7: "partnerships & one-on-one relationships",
    8: "transformation, shared resources & depth",
    9: "travel, philosophy & higher learning",
    10: "career, reputation & public image",
    11: "social networks, groups & future vision",
    12: "solitude, spirituality & hidden matters",
};

export async function POST(req: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("[/api/summary] Missing GEMINI_API_KEY environment variable.");
        return NextResponse.json({ 
            error: "API configuration missing",
            verdict: "caution",
            headline: "AI Summary is currently unavailable due to missing API configuration.",
            bestWindows: [],
            avoidWindows: [],
        }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const body = await req.json();
        const {
            name,
            sunSign,
            destination,
            travelDate,
            planetLines,
            transits,
            natalPlanets,
            chartRuler,
            worldTransits = [],
            angularPlanets = [],
            travelWindows = [],
            macroScore,
        } = body;

        // Build concise data summaries for the AI (no km distances — just planet + house info)
        const planetLinesSummary = (planetLines || [])
            .slice(0, 6)
            .map((l: { planet: string; angle: string; distance_km: number; orb?: number; is_paran?: boolean }) => {
                const influence = l.distance_km <= 160 ? "intense" : l.distance_km <= 480 ? "strong" : l.distance_km <= 800 ? "moderate" : "background";
                return `${l.planet} ${l.angle} (${influence} influence)`;
            })
            .join(", ");

        const transitsSummary = (transits || [])
            .slice(0, 6)
            .map((t: { planets: string; type: string; system?: string; orb?: number }) =>
                `${t.planets} (${t.type})`
            )
            .join(", ");

        const natalSummary = (natalPlanets || [])
            .slice(0, 8)
            .map((p: { planet: string; sign: string; house: number; condition?: string; dignity?: string }) => {
                const extras = [p.condition, p.dignity].filter(Boolean).join(", ");
                return `${p.planet} in ${p.sign} (${p.house}${ordinal(p.house)} house)${extras ? ` [${extras}]` : ""}`;
            })
            .join(", ");

        const worldTransitsSummary = (worldTransits as Array<{
            p1: string; p2: string; aspect: string; orb: number; applying: boolean; isTense: boolean;
        }>)
            .slice(0, 4)
            .map(t => `${t.p1} ${t.aspect} ${t.p2} (orb ${t.orb.toFixed(1)}°, ${t.applying ? "applying" : "separating"}${t.isTense ? " — TENSE" : ""})`)
            .join("; ") || "No major collective aspects active.";

        const angularSummary = (angularPlanets as Array<{
            planet: string; angle: string; sign: string; degree: number;
        }>)
            .map(a => `${a.planet} ${a.angle} (${a.degree.toFixed(0)}° ${a.sign})`)
            .join(", ") || "None";

        // Format computed travel windows for no-date context
        const travelWindowsSummary = (travelWindows as Array<{
            month: string; quality: string; reason: string; house: string;
        }>)
            .filter((w) => w.quality !== "caution")
            .slice(0, 4)
            .map((w) => `${w.month}: ${w.quality} (${w.house} — ${w.reason})`)
            .join("; ") || "";

        // Chart ruler context
        let chartRulerContext = "";
        let relocatedHouseTheme = "";
        if (chartRuler && chartRuler.relocatedAscSign && chartRuler.chartRuler) {
            const h = chartRuler.relocatedRulerHouse || 0;
            relocatedHouseTheme = HOUSE_THEMES[h] || "";
            chartRulerContext = `At ${destination}, you become a ${chartRuler.relocatedAscSign} rising (from natal ${chartRuler.natalAscSign}). Your chart ruler is ${chartRuler.chartRuler}, moving from your ${chartRuler.natalRulerHouse}${ordinal(chartRuler.natalRulerHouse)} house to your ${h}${ordinal(h)} house (${relocatedHouseTheme}).`;
        }

        // --- Compute windows programmatically ---
        const bestWindows: any[] = [];
        const avoidWindows: any[] = [];
        const usedDates = new Set<string>();
        const baseDate = travelDate ? new Date(travelDate + "T12:00:00") : new Date();

        (transits || []).forEach((t: any, i: number) => {
            const aspectStr = String(t.aspect || t.type).toLowerCase();
            const rawPlanets = String(t.planets || `${t.transit_planet} ${t.aspect} ${t.natal_planet}`);
            const planet1 = String(t.transit_planet || (t.planets ? t.planets.split(" ")[0] : ""));
            const planet2 = String(t.natal_planet || (t.planets && t.planets.includes("natal") ? t.planets.split("natal ")[1] : ""));
            const allPlanetsStr = rawPlanets.toLowerCase();

            const isSquare = ["square", "□"].some(a => aspectStr.includes(a) || rawPlanets.includes(a));
            const isOpposition = ["opposition", "☍"].some(a => aspectStr.includes(a) || rawPlanets.includes(a));
            const isHard = isSquare || isOpposition;
            const isSoft = ["trine", "sextile", "△", "⚹"].some(a => aspectStr.includes(a) || rawPlanets.includes(a));
            const isConjunction = ["conjunction", "☌"].some(a => aspectStr.includes(a) || rawPlanets.includes(a));

            const benefics = ["venus", "jupiter"];
            const malefics = ["mars", "saturn"];
            const outerPlanets = ["uranus", "neptune", "pluto"];

            const involvesMalefic = malefics.some(p => allPlanetsStr.includes(p));
            const involvesBenefic = benefics.some(p => allPlanetsStr.includes(p));
            const involvesOuter = outerPlanets.some(p => allPlanetsStr.includes(p));

            let isChallenging = false;
            let isSuperBenefic = false;

            if (isHard) {
                if (involvesMalefic || involvesOuter) isChallenging = true;
            } else if (isConjunction) {
                if (involvesMalefic && involvesOuter) isChallenging = true;
                else if (malefics.includes(planet1.toLowerCase()) && malefics.includes(planet2.toLowerCase())) isChallenging = true;
                else if (involvesBenefic && !involvesMalefic && !involvesOuter) isSuperBenefic = true;
            } else if (isSoft) {
                if (involvesBenefic) isSuperBenefic = true;
            }

            const startDate = t.date ? new Date(t.date) : new Date(baseDate.getTime() + (i * 3 - 5) * 86400000);
            const endDate = new Date(startDate.getTime() + 4 * 86400000);
            const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/ /g, " ");
            const datesStr = `${startDate.getDate()} ${startDate.toLocaleDateString("en-GB", { month: "short" })} – ${fmt(endDate)}`;

            if (usedDates.has(datesStr)) return;

            let why = "";
            if (isChallenging) {
                if (involvesOuter) why = "Deep upheaval or unexpected friction at a structural level.";
                else if (allPlanetsStr.includes("mars") && allPlanetsStr.includes("saturn")) why = "Heavy restrictions and frustrations — avoid major commitments.";
                else if (allPlanetsStr.includes("mars")) why = "High friction energy — potential for exhaustion or conflict.";
                else if (allPlanetsStr.includes("saturn")) why = "Delays, restrictions, and external roadblocks requiring patience.";
                else why = "Challenging transit — expect minor delays or friction.";
            } else if (isSuperBenefic || (!isChallenging && isSoft)) {
                if (allPlanetsStr.includes("venus") && allPlanetsStr.includes("jupiter")) why = "Peak window for social connection, indulgence, and outsized luck.";
                else if (allPlanetsStr.includes("venus")) why = "Ideal for romance, aesthetic experiences, and social grace.";
                else if (allPlanetsStr.includes("jupiter")) why = "Excellent for expansion, networking, and positive experiences.";
                else if (involvesMalefic) why = "Focused discipline — great for structured productivity.";
                else why = "Harmonious energy supporting clarity and smooth travel.";
            }

            const windowObj = { dates: datesStr, transit: rawPlanets, why, _startMs: startDate.getTime(), _endMs: endDate.getTime() };

            if (isChallenging) {
                avoidWindows.push(windowObj);
                usedDates.add(datesStr);
            } else if (isSuperBenefic || (!isChallenging && i < 2)) {
                if (!windowObj.why) windowObj.why = "Clear skies — unobstructed period for travel.";
                bestWindows.push(windowObj);
                usedDates.add(datesStr);
            }
        });

        const finalBest = bestWindows.slice(0, 3);
        const finalAvoid = avoidWindows.slice(0, 2);

        // Real transit data from page.tsx uses a combined `planets` string
        // (e.g. "Mars square Uranus") and `type` field. We check all variants.
        let travelDateConflict: string | null = null;
        if (travelDate) {
            const HARD_ASPECTS = ["square", "opposition", "□", "☍"];
            const MALEFIC_PLANETS = ["mars", "saturn", "uranus", "pluto"];

            // Combine personal transits + world transits into one scan
            const allTransitsToScan = [
                ...(transits || []),
                ...(worldTransits || []),
            ];

            const conflictTransit = allTransitsToScan.find((t: any) => {
                // Shortcut: mundane API marks tense transits directly
                if (t.isTense === true && t.applying !== false) return true;
                // All possible field names for the aspect type
                const aspectStr = String(t.aspect || t.type || t.aspect_type || "").toLowerCase();
                // All possible schemas: planets (combined), p1/p2 (mundane), transit_planet/natal_planet
                const planetStr = String(
                    t.planets ||
                    `${t.p1 || t.transit_planet || ""} ${t.aspect || t.type || ""} ${t.p2 || t.natal_planet || ""}`
                ).toLowerCase();
                const fullStr = `${aspectStr} ${planetStr}`.toLowerCase();
                const isHard = HARD_ASPECTS.some(a => fullStr.includes(a));
                const involvesMalefic = MALEFIC_PLANETS.some(p => fullStr.includes(p));
                const isNotSeparating = t.applying !== false;
                return isHard && involvesMalefic && isNotSeparating;
            });

            if (conflictTransit) {
                const planetDesc = String(
                    conflictTransit.planets ||
                    (conflictTransit.p1 && conflictTransit.p2
                        ? `${conflictTransit.p1} ${conflictTransit.aspect || conflictTransit.type || ""} ${conflictTransit.p2}`
                        : `${conflictTransit.transit_planet || ""} ${conflictTransit.aspect || conflictTransit.type || ""} ${conflictTransit.natal_planet || ""}`)
                ).trim();
                const orb = conflictTransit.orb != null ? ` (${conflictTransit.orb}° orb)` : "";
                travelDateConflict = `Travel date ${travelDate} has an active tense transit: ${planetDesc}${orb}. High friction, volatility, and potential travel disruptions — NOT ideal timing.`;
                console.log("[summary/conflict-detected]", travelDateConflict);
            }

            // Backup 1: check avoid window timestamps (4-day window)
            if (!travelDateConflict) {
                const tdMs = new Date(travelDate + "T12:00:00").getTime();
                for (const av of (avoidWindows as any[])) {
                    if (av._startMs != null && tdMs >= av._startMs && tdMs <= av._endMs) {
                        travelDateConflict = `Travel date ${travelDate} falls inside avoid window "${av.dates}": ${av.transit}. ${av.why}`;
                        console.log("[summary/conflict-window]", travelDateConflict);
                        break;
                    }
                }
            }

            // Backup 2: if avoidWindows exist (tense transit was detected), check if
            // travelDate is within 7 days of the avoid window start date.
            // This catches cases where the 4-day range missed the exact date.
            if (!travelDateConflict && avoidWindows.length > 0) {
                const tdMs = new Date(travelDate + "T12:00:00").getTime();
                for (const av of (avoidWindows as any[])) {
                    if (av._startMs != null) {
                        const diffDays = Math.abs(tdMs - av._startMs) / 86400000;
                        if (diffDays <= 7) {
                            travelDateConflict = `Travel date ${travelDate} is within the high-friction window (${av.dates}): ${av.transit}. ${av.why}`;
                            console.log("[summary/conflict-backup2]", travelDateConflict);
                            break;
                        }
                    }
                }
            }

            console.log("[summary/debug] travelDate:", travelDate,
                "| transits:", (transits || []).length,
                "| worldTransits:", (worldTransits || []).length,
                "| avoidWindows:", avoidWindows.length,
                "| conflict:", travelDateConflict ? "YES" : "none"
            );
        }

        // ── The AI prompt: date-first, activity-focused, personal ──
        const prompt = `You are a personal travel astrologer writing a concise trip summary for ${name}${sunSign ? ` (${sunSign} Sun)` : ""}.

TRAVEL PLANS:
- Destination: ${destination}
- Travel date: ${travelDate || "flexible / not specified"}
- Computed avoid windows: ${finalAvoid.length > 0 ? finalAvoid.map((w: {dates: string; transit: string; why: string}) => `${w.dates} (${w.transit}: ${w.why})`).join(" | ") : "none"}
- Computed best windows: ${finalBest.length > 0 ? finalBest.map((w: {dates: string; transit: string; why: string}) => `${w.dates} (${w.transit}: ${w.why})`).join(" | ") : "none"}
${travelWindowsSummary ? `- 12-month window quality data: ${travelWindowsSummary}` : ""}
${chartRulerContext ? `\nRELOCATION CONTEXT:\n${chartRulerContext}` : ""}

ASTROLOGICAL DATA:
- ACG lines near destination: ${planetLinesSummary || "none within range"}
- Personal transits active: ${transitsSummary || "none computed"}
- Natal placements: ${natalSummary || "not provided"}
- COLLECTIVE SKY (world transits active on travel date): ${worldTransitsSummary}
- Planets crossing the destination's angles (angular planets): ${angularSummary}

YOUR TASK: Return ONLY valid JSON with this exact structure. No markdown, no explanation.

{
  "score": <number 0-100>,
  "verdict": "excellent" | "good" | "caution" | "avoid",
  "headline": "<3-4 sentences>"
}

SCORING RULES:
- The score should primarily reflect the TIMING (travel date) quality, not just the permanent ACG lines.
- **IMPORTANT**: If macroScore is provided (${macroScore}), use it as your definitive baseline score before applying overrides for specific timing conflicts.
- If strong benefic transits (Jupiter trines, Venus sextiles, Sun-Jupiter conjunctions) are active on the travel date → score 75-95.
- If mixed — some benefic support offset by a hard aspect → score 55-74.
- If challenging transits dominate (Saturn squares, Mars oppositions, tense world transits) → score 30-54.
- Tense COLLECTIVE sky aspects (world transits) drag the score down — they affect everyone at the destination.
- If no transit data is provided, score based on ACG line quality + chart ruler placement.
${travelDateConflict ? `
!! CRITICAL OVERRIDE — TRAVEL DATE IN AVOID WINDOW !!
Detected conflict: ${travelDateConflict}
You MUST:
  - Set score ≤ 44 (the date is in a challenging window; do NOT score it above caution)
  - Do NOT describe the timing as "excellent," "great," "perfect," or "ideal"
  - The FIRST sentence MUST warn about the conflict: "Your [date] falls in a high-friction window — [transit name] is creating [specific risk]. If possible, shift your travel to [best window dates]."
  - Only AFTER the warning, briefly note what is still positive about the destination.
!! END CRITICAL OVERRIDE !!
` : ""}

HEADLINE RULES — write like a personal advisor, NOT a textbook:
${travelDate ? `
1. LEAD with the travel date and its quality: "Your [date] timing is [quality] — [reason]."
2. Name which HOUSES are activated and what ACTIVITIES those houses support (everyday language, not house numbers).
3. **CRITICAL — DATE AVOIDANCE**: If there are avoid windows that overlap with or are close to the travel date, include an explicit sentence like: "Avoid traveling on [dates] — [transit name] creates [specific risk]."
4. If the planned travel date itself falls in an avoid window, say so clearly: "Your booked date of ${travelDate} falls in a high-friction window. If possible, shift to [best window dates]."
5. Recommend 1-2 specific activities for the trip theme.
6. End with a one-line overall theme for the trip.
`.trim() : `
1. Since no travel date is set, open with: "Your timing is flexible — here are the best windows to plan around."
2. Recommend 2-3 SPECIFIC date ranges from the 12-month window data or computed best windows. Use exact month/date ranges (e.g. "mid-March 2026" or "early April 2026"). Explain which houses each window activates and what activities they support.
3. Name 1 window to clearly AVOID and why (from computed avoid windows or collective sky).
4. End with a one-line theme for the destination.
`.trim()}
7. Do NOT mention distances in km or miles. Do NOT mention orb degrees. Do NOT use technical jargon like "angular," "cadent," or "succedent."
8. Write in second person ("you"), conversational but authoritative. Keep it to 4 sentences max.

TONE AND STYLE GUIDELINES (do NOT copy these patterns literally — vary them every time):
- Vary your sentence openings. Don't always lead with "Your [date] timing is..."
  Options: "February 28 carries..." / "The planetary setup on [date]..." / "Heading into [date]," / "[Date] lands in a..." / "With [transit] exact on [date],"
- Match the energy of your language to the actual transit: harsh aspects → direct, grounded warning tone; benefic aspects → warm, expansive tone.
- Never use generic travel clichés. Be specific to the transit and destination.
- End with a trip theme that feels earned by the data, not generic. Vary the structure of that line.
- If timing is bad, do not soften the warning with excessive positivity. Be honest and direct.`;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                maxOutputTokens: 800,
                temperature: 0.7,
                responseMimeType: "application/json",
            },
        });

        const raw = response.text ?? "";
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
        const parsed = JSON.parse(cleaned);

        // Normalize verdict to our 3-tier system
        if (parsed.verdict === "good") parsed.verdict = "excellent";

        parsed.bestWindows = finalBest.map(({ _startMs, _endMs, ...rest }: any) => rest);
        parsed.avoidWindows = finalAvoid.map(({ _startMs, _endMs, ...rest }: any) => rest);

        // The AI returns a score — pass it through
        if (typeof parsed.score === "number") {
            parsed.aiScore = parsed.score;
        }

        return NextResponse.json(parsed);
    } catch (err) {
        console.error("[/api/summary] error:", err);
        return NextResponse.json({
            verdict: "caution",
            headline: "Astrological analysis is being computed. Check the full reading below for detailed insights.",
            bestWindows: [],
            avoidWindows: [],
        });
    }
}
