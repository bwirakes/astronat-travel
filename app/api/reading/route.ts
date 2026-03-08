/**
 * POST /api/reading
 * Stream a personalized travel reading via Gemini Flash Lite.
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
        } = body;

        // Build a rich astrological prompt
        const planetLinesSummary = (planetLines || [])
            .slice(0, 5)
            .map((l: { planet: string; angle: string; distance_km: number }) =>
                `${l.planet} ${l.angle} — ${l.distance_km}km from ${destination}`
            )
            .join("\n");

        const transitsSummary = (transits || [])
            .slice(0, 4)
            .map((t: { planets: string; type: string }) => `${t.planets} (${t.type})`)
            .join(", ");

        const natalSummary = (natalPlanets || [])
            .slice(0, 5)
            .map((p: { planet: string; sign: string; house: number }) =>
                `${p.planet} in ${p.sign} (House ${p.house})`
            )
            .join(", ");

        const travelDateNote = travelDate
            ? `The user plans to travel on ${travelDate}.`
            : "No specific travel date was given — provide a general analysis.";

        const prompt = `You are Astro Nat — a precise, thoughtful astrocartography and transit astrologer. Your readings are direct, deeply informed, and never generic. You avoid vague spiritual language. You speak to the real mechanics of what the chart is saying.

Write a personalised travel reading for ${name}${sunSign ? ` (${sunSign} Sun)` : ""} who is planning to travel to ${destination}.

${travelDateNote}

Astrological data:

PLANETARY LINES NEAR ${destination.toUpperCase()}:
${planetLinesSummary || "No planetary line data available — write a general destination reading."}

NATAL CHART (key placements):
${natalSummary || "Natal chart not available."}

ACTIVE TRANSITS AT TIME OF TRAVEL:
${transitsSummary || "No transit data available."}

Write 4–5 paragraphs covering:
1. The dominant planetary line and what it means in practice for this person in ${destination}
2. What the transits are doing at the time of travel and how that affects the trip
3. Practical guidance — what to lean into, what to be mindful of
4. The optimal energy this location activates in the natal chart
5. A brief summary sentence at the end

Style: Editorial, precise, warm but not effusive. No emojis. Short paragraphs. Use **bold** for planet names and key concepts.`;

        // Stream via Gemini
        const response = await ai.models.generateContentStream({
            model: "gemini-2.0-flash-lite",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                maxOutputTokens: 800,
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
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        });
    } catch (err) {
        console.error("[/api/reading]", err);
        return new Response("Error generating reading.", { status: 500 });
    }
}
