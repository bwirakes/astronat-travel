/**
 * POST /api/reading
 * Stream a personalized travel reading via Gemini 3.1 Flash-Lite Preview.
 * Returns a ReadableStream so the client can display text as it arrives.
 */
import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
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
            currentEphemeris,
            worldTransits = [],
            angularPlanets = [],
            chartRuler,
        } = body;

        // Build a rich astrological prompt
        const getDistanceRanking = (km: number) => {
            const miles = km / 1.60934;
            if (miles <= 100) return "Strongest Influence";
            if (miles <= 300) return "Moderate Influence";
            if (miles <= 500) return "Weak Influence";
            return "Negligible Influence";
        };

        const planetLinesSummary = (planetLines || [])
            .slice(0, 8)
            .map((l: { planet: string; angle: string; distance_km: number; orb?: number; is_paran?: boolean }) => {
                const type = l.is_paran ? "Paran Line (latitude)" : "ACG Line";
                const ranking = getDistanceRanking(l.distance_km);
                return `${l.planet} ${l.angle} (${type}) — ${l.distance_km}km from ${destination}. ${ranking}. Orb: ${l.orb ?? "?"} degrees.`;
            })
            .join("\n");

        const transitsSummary = (transits || [])
            .slice(0, 8)
            .map((t: { planets: string; type: string; system?: string; orb?: number }) => 
                `${t.planets} (${t.type}, ${Math.abs(t.orb || 0)}° orb, System: ${t.system || "natal" })`
            )
            .join("\n");

        const natalSummary = (natalPlanets || [])
            .slice(0, 8)
            .map((p: { planet: string; sign: string; house: number; condition?: string; dignity?: string }) => {
                const extras = [p.condition, p.dignity].filter(Boolean).join(", ");
                return `${p.planet} in ${p.sign} (House ${p.house}) ${extras ? `[${extras}]` : ""}`;
            })
            .join("\n");

        // World transits (mundane) — sky-to-sky, affect everyone
        const worldTransitsSummary = (worldTransits as Array<{
            p1: string; p2: string; aspect: string; orb: number;
            p1Deg: number; p1Sign: string; p2Deg: number; p2Sign: string;
            applying: boolean; isTense: boolean;
        }>)
            .slice(0, 6)
            .map(t =>
                `${t.p1} (${t.p1Deg}° ${t.p1Sign}) ${t.aspect} ${t.p2} (${t.p2Deg}° ${t.p2Sign}) — orb ${t.orb.toFixed(2)}° [${t.applying ? "Applying" : "Separating"}]${t.isTense ? " ⚠️ TENSE" : ""}`
            )
            .join("\n") || "No major sky-to-sky aspects within orb on this date.";

        const angularSummary = (angularPlanets as Array<{
            planet: string; angle: string; sign: string; degree: number; distFromLocation: number;
        }>)
            .map(a => `${a.planet} ${a.angle} over ${destination} — ${a.degree}° ${a.sign}, ~${a.distFromLocation}km from city centre`)
            .join("\n") || "No transiting planets are angular directly over this location on this date.";

        // Current sky positions (ephemeris) sent from the client
        const ephemerisSummary = (currentEphemeris || []).join(", ");

        const travelDateNote = travelDate
            ? `The user is targeting travel around ${travelDate}, but their dates are flexible. They want to identify the best windows within roughly 30 days of this date — treat it as a planning anchor, not a fixed departure.`
            : "No specific travel date was given — provide a general seasonal analysis based on current transits.";

        const next30DaysInstruction = travelDate
            ? `Write an incisive assessment of the ACG lines near ${destination} around the target date of ${travelDate}. Name which lines are closest, their orb tier, and how planetary dignities affect their expression. Do NOT recommend specific travel date windows here — that belongs in Personal Timing.`
            : `Write an incisive assessment of the dominant ACG lines near ${destination}, differentiating geodetic vs natal lines. Call out tight orbs and planetary dignities.`;

        // Chart ruler context from computed data
        let chartRulerInstruction = "";
        if (chartRuler && chartRuler.relocatedAscSign && chartRuler.chartRuler) {
            chartRulerInstruction = `
COMPUTED CHART RULER DATA (USE THIS — do NOT guess the chart ruler):
- Relocated Rising Sign: ${chartRuler.relocatedAscSign}
- Chart Ruler: ${chartRuler.chartRuler}
- Chart Ruler natal house: ${chartRuler.natalRulerHouse}
- Chart Ruler relocated house: ${chartRuler.relocatedRulerHouse}
- Natal Rising Sign: ${chartRuler.natalAscSign}
Use EXACTLY these values when discussing the chart ruler and relocated rising sign. Do NOT infer a different chart ruler.`;
        }

        const prompt = `You are Astro Nat — a precise, incisive astrocartography and transit astrologer. Your readings are editorial, deeply technical, and never generic.

Write a comprehensive personalised travel reading for ${name}${sunSign ? ` (${sunSign} Sun)` : ""} planning to travel to ${destination}.

${travelDateNote}

## Astrocartography Ground Rules (apply these throughout):
- The natal astrocartography map is PERMANENT — it never changes. Lines stay fixed. What changes is whether a location is active and what timing amplifies or dampens it.
- **Orb of influence**: Intense (<150 miles) · Strong (150–300 miles) · Moderate (300–500 miles) · Background (>500 miles). Jim Lewis originally used 800 miles but modern practice uses 600 miles max. Name the orb tier clearly for the most important lines.
- **East vs West of a line**: Moving West of a line = more angular and dynamic (e.g. west of an MC line activates full 10th house — career, reputation, authority). Moving East = more cadent (9th house: publishing, learning, travel, philosophy). Call this out when relevant.
- **Paran lines (latitude crossings)**: These operate at 75 miles max NORTH or SOUTH of the crossing latitude — not longitude dependent. They work worldwide at that latitude. They are secondary but crucial — a difficult paran can override a beneficial ACG line.
- **House Placements are MANDATORY for every transit**: For every transit mentioned, state which house of ${name}'s RELOCATED chart at ${destination} it activates, and what that house governs for travel. Example: "Jupiter transiting the 9th house in the relocated chart = expansion through foreign culture, long-distance learning, philosophy." or "Saturn entering the 12th house: isolation, hidden restrictions, need for retreat."
- **Relocated chart**: Shifts houses and angles, but NOT natal planets or their aspects.

Take into consideration the tightness of the orb (0–5 degrees is strongest), planetary conditions/dignities (like detriment or unaspected planets), and the different weights of Geodetic vs Natal transits. Clearly differentiate if a line is a transit to a geodetic point or a personal natal line.
${chartRulerInstruction}
---
PLANETARY LINES NEAR ${destination.toUpperCase()}:
${planetLinesSummary || "No planetary line data — write a general destination reading."}

WORLD SKY (MUNDANE TRANSITS) ON ${travelDate || "TRAVEL DATE"}:
These are sky-to-sky aspects — they affect EVERYONE at ${destination}, not just this person.
${worldTransitsSummary}

ANGULAR PLANETS OVER ${destination.toUpperCase()} ON TRAVEL DATE:
${angularSummary}

CURRENT SKY (Ephemeris at time of travel):
${ephemerisSummary || "March 2026: Sun in Pisces, Mars in Cancer (retrograde), Jupiter in Gemini, Saturn in Pisces"}

NATAL CHART (key placements):
${natalSummary || "Natal chart not provided."}

ACTIVE NATAL TRANSITS:
${transitsSummary || "Transit data not available."}
---

Structure your reading with these SIX section headers (use ## for each). ORDER MATTERS:

## Your Permanent Map Here
${next30DaysInstruction}
For each major ACG line: planet, angle, orb tier (Intense/Strong/Moderate/Background), east/west of line, which relocated house it activates, and what that house concretely means for the trip.
DO NOT discuss the chart ruler or relocation here — only ACG lines and their proximity.

## Your Personal Timing
2–3 paragraphs on PERSONAL transits. For every transit explicitly state: (1) transiting planet + sign + natal planet/point aspected + orb, (2) which house of ${name}'s natal chart this activates, (3) in the relocated chart at ${destination} which house this becomes, and (4) what that house rules and how it shapes the trip experience. Be specific and concrete.
${travelDate ? `
After the transit analysis, provide a "Recommended Windows" sub-section formatted as a bullet list:
- If any hard/tense transits (squares, oppositions involving Mars, Saturn, Uranus, Pluto) are applying within ±3 days of ${travelDate}, LEAD with: "⚠ Your travel date of ${travelDate} overlaps with [transit name] — [specific risk]. Avoid this window if possible."
- Then list 1–2 optimal date windows within 30 days of ${travelDate} that avoid the friction periods.
- For each window explain which transit makes it favourable and what it supports.
- Do NOT list ${travelDate} as a recommended window if it conflicts with an active tense transit.` : ''}

## Collective Climate
2 paragraphs on sky-to-sky world transits affecting ${destination} for everyone. Name each tense aspect, its orb, applying/separating, and how it shapes the collective atmosphere. Also mention if any similar planetary configurations have historically corresponded with notable world events.

## Your Relocated Chart
This section is ABOUT the chart ruler and relocation ONLY. ${chartRuler ? `Use EXACTLY these values: relocated rising = ${chartRuler.relocatedAscSign}, chart ruler = ${chartRuler.chartRuler}, natal house ${chartRuler.natalRulerHouse} → relocated house ${chartRuler.relocatedRulerHouse}.` : "Identify the chart ruler and how relocation changes the rising sign and house placements."}
2 paragraphs explaining: (1) what the new rising sign and chart ruler placement mean for the trip experience, and (2) how key natal planets shift houses in the relocated chart and what themes that activates. Reference house meanings concretely.

## Country Natal Chart
2–3 paragraphs. Name ${destination}'s country natal Sun/Moon signs (if known — use the country's independence or founding chart). Which world transits are currently hitting the country chart? What does this mean for the country's collective energy? How does it affect a visitor's experience of the place right now? Include specific planet-to-chart aspects.

## Verdict
Provide date recommendations using EXACTLY this structure and format — do not deviate:

**Best Travel Windows**
- [date range 1] — [transit that makes it optimal]
- [date range 2] — [transit that makes it optimal]

**Dates to Avoid**
- [date range] — [exact transit and why, e.g. "Mars square Uranus — high volatility, travel disruptions likely"]

**Best House Activations**
- [House name + planet] — [what it enables, e.g. "9th House Jupiter — ideal for cultural immersion and long-form learning"]
- [House name + planet] — [what it enables]
- [House name + planet] — [what it enables]

Output ONLY this structured list. No other text, no introductory sentences, no tables.
Style rules: editorial, precise. Bold each header exactly as shown. No emojis.`;

        // Stream via Gemini 3.1 Flash-Lite Preview
        const response = await ai.models.generateContentStream({
            model: "gemini-3.1-flash-lite-preview",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                maxOutputTokens: 4000,
                temperature: 0.7,
            },
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of response) {
                        const text = chunk.text ?? "";
                        if (text) {
                            controller.enqueue(encoder.encode(text));
                        }
                    }
                } catch (err) {
                    console.error("[/api/reading stream]", err);
                    // Send fallback text inline so the frontend always shows something
                    controller.enqueue(encoder.encode(
                        "Reading temporarily unavailable. The planetary data has been calculated — please try again in a moment."
                    ));
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-store",
                "X-Accel-Buffering": "no",
            },
        });
    } catch (err) {
        console.error("[/api/reading] outer error:", err);
        // Return 200 with a graceful message so the frontend streams it as text
        const encoder = new TextEncoder();
        const msg = "Your planetary line data has been calculated. The AI reading is temporarily unavailable — the astrological picture is clear from the data above.";
        return new Response(
            new ReadableStream({
                start(c) { c.enqueue(encoder.encode(msg)); c.close(); }
            }),
            {
                status: 200,
                headers: { "Content-Type": "text/plain; charset=utf-8" },
            }
        );
    }
}
