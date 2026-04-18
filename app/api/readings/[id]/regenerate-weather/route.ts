import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeWeatherReading, type WeatherReadingInput } from "@/lib/ai/prompts/geodetic-weather";
import type { Tone } from "@/lib/ai/schemas";

/**
 * POST /api/readings/[id]/regenerate-weather
 *
 * Re-runs ONLY the AI interpretation against an existing weather reading.
 * Stored day data (cities, forecasts) stays intact — just refreshes the
 * editorial fields the brief uses. No credit burn, no ephemeris recompute.
 */

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pickTone(severity: number | undefined): Tone {
    if (severity == null) return "neutral";
    if (severity > 0) return "challenging";
    if (severity < 0) return "supportive";
    return "neutral";
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: "Missing reading id" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: reading, error: loadErr } = await supabase
        .from("readings")
        .select("id, user_id, details")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (loadErr || !reading) {
        return NextResponse.json({ error: "Reading not found" }, { status: 404 });
    }

    const details: any = reading.details ?? {};
    const wf = details.weatherForecast;
    if (!wf?.cities?.length) {
        return NextResponse.json(
            { error: "This reading is not a weather reading." },
            { status: 400 },
        );
    }

    const windowDays: number = wf.windowDays ?? 30;
    const cityForecasts = wf.cities;
    const allDays = cityForecasts.flatMap((c: any) => c.days ?? []);

    const macroScore =
        typeof wf.macroScore === "number"
            ? wf.macroScore
            : Math.round(
                  allDays.reduce((a: number, d: any) => a + (d.score ?? 60), 0) /
                      Math.max(1, allDays.length),
              );

    const flatEvents = cityForecasts.flatMap((c: any) =>
        (c.days ?? []).flatMap((d: any) =>
            (d.events ?? []).map((e: any) => ({ ...e, dateUtc: d.dateUtc, cityLabel: c.label })),
        ),
    );
    const topEvents = [...flatEvents]
        .sort((a, b) => Math.abs(b.severity ?? 0) - Math.abs(a.severity ?? 0))
        .slice(0, 8);

    const bestDay = [...allDays].sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))[0];
    const worstDay = [...allDays].sort((a: any, b: any) => (a.score ?? 0) - (b.score ?? 0))[0];

    const aiInput: WeatherReadingInput = {
        destination: details.destination ?? cityForecasts[0].label,
        dateRange: {
            start: wf.startDate,
            end: wf.endDate,
        },
        windowDays,
        overallScore: macroScore,
        bestDay: bestDay
            ? { date: bestDay.dateUtc.slice(0, 10), label: fmtDate(bestDay.dateUtc) }
            : null,
        worstDay: worstDay
            ? { date: worstDay.dateUtc.slice(0, 10), label: fmtDate(worstDay.dateUtc) }
            : null,
        topEvents: topEvents.map((e: any) => {
            const a = e.planets?.[0] ?? "";
            const b = e.planets?.[1] ?? "";
            return {
                aspect: e.label || `${a} ${e.layer ?? ""} ${b}`.trim(),
                planets: { a, b },
                dates: fmtDate(e.dateUtc),
                tone: pickTone(e.severity),
                angle: e.angle,
            };
        }),
        // Reuse the persisted personal lens if available — regeneration
        // should not recompute the natal chart.
        personalLens: wf.personalLens
            ? {
                  relocatedAscSign: wf.personalLens.relocatedAscSign,
                  chartRulerPlanet: wf.personalLens.chartRulerPlanet,
                  chartRulerNatalHouse: wf.personalLens.chartRulerNatalHouse,
                  chartRulerRelocatedHouse: wf.personalLens.chartRulerRelocatedHouse,
                  chartRulerNatalDomain: wf.personalLens.chartRulerNatalDomain,
                  chartRulerRelocatedDomain: wf.personalLens.chartRulerRelocatedDomain,
                  activeAngleLines: (wf.personalLens.activeAngleLines ?? []).map((l: any) => ({
                      planet: l.planet,
                      angle: l.angle,
                      orbDeg: l.orbDeg,
                      isChartRuler: l.isChartRuler,
                  })),
                  worldPointContacts: (wf.personalLens.worldPointContacts ?? []).map((w: any) => ({
                      planet: w.planet,
                      pointType: w.pointType,
                      orbDeg: w.orbDeg,
                  })),
              }
            : null,
    };

    try {
        const interpretation = await writeWeatherReading(aiInput);

        const newDetails = {
            ...details,
            weatherForecast: {
                ...wf,
                macroScore,
                interpretation,
                generated: new Date().toISOString(),
            },
        };

        const { error: updateErr } = await supabase
            .from("readings")
            .update({ details: newDetails, reading_score: macroScore })
            .eq("id", id)
            .eq("user_id", user.id);

        if (updateErr) {
            console.error("Regenerate: update failed", updateErr);
            return NextResponse.json({ error: "Failed to persist regeneration" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Regenerate-weather failed:", err);
        return NextResponse.json(
            { error: "AI regeneration failed", message: err?.message },
            { status: 500 },
        );
    }
}
