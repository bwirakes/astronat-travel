/**
 * POST /api/summary
 * Returns structured JSON verdict for the destination:
 * overall score, headline synthesis, best/avoid travel windows.
 */
import { NextRequest, NextResponse } from "next/server";
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

        const planetLinesSummary = (planetLines || [])
            .slice(0, 6)
            .map((l: { planet: string; angle: string; distance_km: number; orb?: number; is_paran?: boolean }) =>
                `${l.planet} ${l.angle} — ${l.distance_km}km${l.orb ? ` (${l.orb}° orb)` : ""}${l.is_paran ? " [Paran]" : ""}`
            )
            .join(", ");

        const transitsSummary = (transits || [])
            .slice(0, 6)
            .map((t: { planets: string; type: string; system?: string; orb?: number }) =>
                `${t.planets} (${t.type}, ${t.system || "natal"})`
            )
            .join(", ");

        const natalSummary = (natalPlanets || [])
            .slice(0, 6)
            .map((p: { planet: string; sign: string; house: number; condition?: string; dignity?: string }) => {
                const extras = [p.condition, p.dignity].filter(Boolean).join(", ");
                return `${p.planet} in ${p.sign} H${p.house}${extras ? ` [${extras}]` : ""}`;
            })
            .join(", ");

        const travelDateContext = travelDate
            ? `Target travel date: ${travelDate}.`
            : "No specific travel date given — use the current period (March 2026).";

        const prompt = `You are an expert astrocartography analyst. Analyze this travel scenario and return ONLY valid JSON, no markdown, no explanation.

Person: ${name}${sunSign ? ` (${sunSign} Sun)` : ""}
Destination: ${destination}
${travelDateContext}

Natal chart: ${natalSummary || "not provided"}
Planetary lines near ${destination}: ${planetLinesSummary || "not provided"}
Active transits: ${transitsSummary || "not provided"}

Return exactly this JSON structure:
{
  "verdict": "excellent" | "caution" | "avoid",
  "headline": "2-3 sentence synthesis of the overall astrological picture for this destination. Be specific, name planets and lines.",
  "bestWindows": [
    { "dates": "date range e.g. 15–22 Apr 2026", "transit": "planet aspect", "why": "one sentence explanation" }
  ],
  "avoidWindows": [
    { "dates": "date range", "transit": "planet aspect", "why": "one sentence explanation" }
  ]
}

Provide 2-4 items in bestWindows and 2-3 in avoidWindows. Base them on the actual transits and lines provided.`;

        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                maxOutputTokens: 1000,
                temperature: 0.4,
                responseMimeType: "application/json",
            },
        });

        const raw = response.text ?? "";

        // Strip any accidental markdown fences
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
        const parsed = JSON.parse(cleaned);

        return NextResponse.json(parsed);
    } catch (err) {
        console.error("[/api/summary] error:", err);
        // Return a graceful fallback so the UI still renders
        return NextResponse.json({
            verdict: "caution",
            headline: "Astrological analysis is being computed. Check the full reading below for detailed insights.",
            bestWindows: [],
            avoidWindows: [],
        });
    }
}
