import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const planet = searchParams.get("planet");
  const sign = searchParams.get("sign");
  const limit = parseInt(searchParams.get("limit") || "10");

  if (!planet) {
    return NextResponse.json({ error: "planet is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  
  let query = supabase
    .from("zodiac_ingresses")
    .select("*")
    .eq("planet_name", planet)
    .order("exact_timestamp_ut", { ascending: false })
    .limit(limit);

  if (sign) {
    query = query.eq("entered_sign", sign);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
