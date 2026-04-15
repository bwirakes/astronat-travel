import { NextRequest, NextResponse } from "next/server";
import { computeRealtimePositions } from "@/lib/astro/transits";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || "");
  const month = parseInt(searchParams.get("month") || "");
  const day = parseInt(searchParams.get("day") || "");
  const hour = parseFloat(searchParams.get("hour") || "0");
  const lon = parseFloat(searchParams.get("lon") || "0");
  const lat = parseFloat(searchParams.get("lat") || "0");

  if (!year || !month || !day) {
    return NextResponse.json({ error: "year, month, and day are required" }, { status: 400 });
  }

  const dtStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T00:00:00Z`;
  const dt = new Date(dtStr);
  dt.setUTCHours(Math.floor(hour));
  dt.setUTCMinutes(Math.floor((hour % 1) * 60));

  try {
    const positions = await computeRealtimePositions(dt);
    return NextResponse.json(positions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
