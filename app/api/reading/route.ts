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
        const planetLinesSummary = (planetLines || [])
            .slice(0, 5)
            .map((l: { planet: string; angle: string; distance_km: number }) =>
                `${l.planet} ${l.angle} — ${l.distance_km}km from ${destination}`
            )
            .join("\n");

        const transitsSummary = (transits || [])
            .slice(0, 6)
            .map((t: { planets: string; type: string }) => `${t.planets} (${t.type})`)
            .join(", ");

        const natalSummary = (natalPlanets || [])
            .slice(0, 6)
            .map((p: { planet: string; sign: string; house: number }) =>
                `${p.planet} in ${p.sign} (House ${p.house})`
            )
            .join(", ");

        // Current sky positions (ephemeris) sent from the client
        const ephemerisSummary = (currentEphemeris || []).join(", ");

        const travelDateNote = travelDate
            ? `The user plans to travel on ${travelDate}.`
            : "No specific travel date was given — provide a general seasonal analysis.";

        const prompt = `You are Astro Nat — a precise, thoughtful astrocartography and transit astrologer. Your readings are direct, deeply informed, and never generic. You speak to the real mechanics of what the chart is saying. No vague spiritual language, no clichés.

Write a personalised travel reading for ${name}${sunSign ? ` (${sunSign} Sun)` : ""} who is planning to travel to ${destination}.

${travelDateNote}

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

Write 4–5 short paragraphs covering:
1. The dominant planetary line and what it means for this specific person in ${destination}
2. What the current sky (ephemeris) is doing at the time of travel and how it interacts with the trip
3. How the active transits affect this journey — the opportunities and the friction points
4. Practical guidance — what to lean into, what to watch for, timing advice
5. A single clear closing sentence summing up the verdict on this trip

Style rules: editorial tone, precise, warm but never effusive. Short paragraphs. No emojis. Bold planet names and key concepts with **asterisks**.`;

        // Stream via Gemini 3.1 Flash-Lite Preview
        const response = await ai.models.generateContentStream({
            model: "gemini-3.1-flash-lite-preview",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                maxOutputTokens: 900,
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
