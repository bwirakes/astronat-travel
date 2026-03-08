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
            ? `The user is targeting travel around ${travelDate}, but their dates are flexible. They want to identify the best windows within roughly 30 days of this date — treat it as a planning anchor, not a fixed departure.`
            : "No specific travel date was given — provide a general seasonal analysis based on current transits.";

        const next30DaysInstruction = travelDate
            ? `Write 2–3 sharp paragraphs covering the transit picture around the target date of ${travelDate}. Name the transits that are peaking and how they interact with this chart. Then recommend 1–2 specific windows within 30 days of ${travelDate} when the transits align most favourably — give approximate date ranges (e.g. "the window of April 18–23") and explain why that window is superior to the target date. Flag any short windows to avoid and why. Be concrete: name the planets, the natal houses they are crossing, and what that means experientially.`
            : `Write 2–3 sharp paragraphs covering the dominant planetary energy in the immediate window. Name the transiting planets, what natal houses they are activating, and what that means experientially. Identify which periods this month favour travel and which to avoid.`;

        const prompt = `You are Astro Nat — a precise, incisive astrocartography and transit astrologer. Your readings are editorial, deeply technical, and never generic. You speak to the real mechanics of what the chart is doing — how planets activate houses, create energetic corridors, and shift the quality of a person's experience on the ground. No vague spiritual language, no clichés.

Write a comprehensive personalised travel reading for ${name}${sunSign ? ` (${sunSign} Sun)` : ""} planning to travel to ${destination}.

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

Structure your reading with these exact three section headers (use ## for headers):

## Next 30 Days
${next30DaysInstruction}

## Rest of Year Outlook
Write 2–3 paragraphs covering the broader year-long transit picture as it relates to travel, place, and movement. Identify the big turning points — Jupiter ingresses, Saturn milestones, any outer planet shifts — and describe what they open or close in terms of travel energy and geographic pull. Discuss how this destination fits into the longer arc.

## House Activations
Write 2–3 paragraphs specifically about which natal houses are being lit up by the current transits, and what that means for travel. Go deep here — explain the difference between a 9th house activation (long-distance, philosophy, foreign culture) vs a 3rd house activation (short trips, mental stimulation, local exploration) vs a 12th house activation (retreat, solitude, spiritual immersion). Talk about which houses are dormant vs electrically alive right now, and what kind of trip would serve this chart. End with a single clear verdict sentence about whether ${destination} serves this chart right now.

Style rules: editorial tone, precise, warm but authoritative. Dense with astrological intelligence. No emojis. Bold planet names and key astrological concepts with **asterisks**.`;

        // Stream via Gemini 3.1 Flash-Lite Preview
        const response = await ai.models.generateContentStream({
            model: "gemini-3.1-flash-lite-preview",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                maxOutputTokens: 1800,
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
