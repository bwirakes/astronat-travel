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

        // Current sky positions (ephemeris) sent from the client
        const ephemerisSummary = (currentEphemeris || []).join(", ");

        const travelDateNote = travelDate
            ? `The user is targeting travel around ${travelDate}, but their dates are flexible. They want to identify the best windows within roughly 30 days of this date — treat it as a planning anchor, not a fixed departure.`
            : "No specific travel date was given — provide a general seasonal analysis based on current transits.";

        const next30DaysInstruction = travelDate
            ? `Write an incisive assessment covering the transit picture around the target date of ${travelDate}. Name the transits that are peaking, including their natal or geodetic system distinction, tight orbs, and how they interact with the chart's dignities. Recommend 1–2 specific windows within 30 days.`
            : `Write an incisive assessment covering the dominant planetary energy in the immediate window, differentiating geodetic vs natal lines. Call out tight orbs and planetary dignities.`;

        const prompt = `You are Astro Nat — a precise, incisive astrocartography and transit astrologer. Your readings are editorial, deeply technical, and never generic. 

Write a comprehensive personalised travel reading for ${name}${sunSign ? ` (${sunSign} Sun)` : ""} planning to travel to ${destination}.

${travelDateNote}

Take into consideration the tightness of the orb (0-5 degrees is strongest), planetary conditions/dignities (like detriment or unaspected planets), and the different weights of Geodetic vs Natal transits. Clearly differentiate if a line is a transit to a geodetic point or a personal natal line.

---
PLANETARY LINES NEAR ${destination.toUpperCase()}:
${planetLinesSummary || "No planetary line data — write a general destination reading."}

CURRENT SKY (Ephemeris at time of travel):
${ephemerisSummary || "March 2026: Sun in Pisces, Mars in Cancer (retrograde), Jupiter in Gemini, Saturn in Pisces"}

NATAL CHART (key placements):
${natalSummary || "Natal chart not provided."}

ACTIVE NATAL TRANSITS:
${transitsSummary || "Transit data not available."}
---

Structure your reading with these exact three section headers (use ## for headers):

## Next 30 Days
${next30DaysInstruction}

## House Activations & Dignities
Write 2–3 paragraphs about which natal houses and planetary dignities are activated. Explain the condition of the chart ruler vs the lines present. Is the destination activating an unaspected or detriment planet? 

## Example of Natal Chart and ACG Lines based on real-time transits
Include a bulleted summary of the most important angles and chart ruler dynamics, then provide a Markdown table EXACTLY structured like this:

| **Planetary Transit & Dates** | **Aspects to ${name}'s Chart Placements** | **ACG lines to avoid** | **Paran (latitude) lines to avoid** |
| --- | --- | --- | --- |
| (Fill this with the most active transits from the context, including the date if known) | (e.g., Square Natal Venus in Cancer at 9 degrees in 3rd) | (Name the corresponding lines based on the transit tension) | (List any challenging Parans) |

Make sure the table maps directly to the active transits and planetary lines provided.

Style rules: editorial tone, precise, authoritative. Dense with astrological intelligence. No emojis. Bold planet names.`;

        // Stream via Gemini 3.1 Flash-Lite Preview
        const response = await ai.models.generateContentStream({
            model: "gemini-3.1-flash-lite-preview",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                maxOutputTokens: 3200,
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
