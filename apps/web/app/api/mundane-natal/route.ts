import { NextRequest, NextResponse } from "next/server";
import { getMundaneChartData } from "@/app/lib/astro/extract-mundane";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Missing country slug" }, { status: 400 });
    }

    const resultData = await getMundaneChartData(slug);
    return NextResponse.json(resultData);
  } catch (err: any) {
    console.error("[/api/mundane-natal] Error:", err);
    return NextResponse.json({ error: err.message }, { status: err.message === "Country not found" ? 404 : 500 });
  }
}
