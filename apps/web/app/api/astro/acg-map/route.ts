import { NextRequest, NextResponse } from "next/server";
import { computeACG } from "@/lib/astro/astrocartography";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");

  if (!dateStr) {
    return NextResponse.json({ error: "date (ISO string) is required" }, { status: 400 });
  }

  try {
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const lines = await computeACG(dt);
    return NextResponse.json({ lines });
  } catch (error: any) {
    console.error("[/api/astro/acg-map] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
