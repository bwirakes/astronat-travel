import { NextRequest, NextResponse } from "next/server";
import { buildGeodeticMatrixResponse } from "@/app/lib/geodetic/weather-matrix";
import { assertWeatherSourceParity, WEATHER_SOURCE_PARITY } from "@/app/lib/geodetic/weather-source-parity";

function parseLongitudeResolution(value: string | null): number {
    const resolution = Number(value ?? "1");
    return Number.isFinite(resolution) ? resolution : 1;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    const params = req.nextUrl.searchParams;
    const startDate = params.get("startDate") ?? undefined;
    const endDate = params.get("endDate") ?? undefined;
    const includeHistorical = params.get("includeHistorical") === "1";
    const longitudeResolution = parseLongitudeResolution(params.get("longitudeResolution"));

    try {
        assertWeatherSourceParity();
        return NextResponse.json(buildGeodeticMatrixResponse({
            startDate,
            endDate,
            longitudeResolution,
            includeHistorical,
        }));
    } catch (error) {
        console.error("[/api/geodetic-weather/matrix]", error);
        return NextResponse.json({
            error: "Geodetic weather matrix failed",
            detail: String(error),
            parity: WEATHER_SOURCE_PARITY,
        }, { status: 500 });
    }
}
