/**
 * POST /api/geodetic-predictions/revalidate
 *
 * Busts the `geodetic-predictions` cache tag. Call this after editing rows in
 * the Supabase dashboard so the public /weather catalog reflects new content
 * within seconds instead of the 1h revalidate window.
 *
 * Auth: bearer token must equal SUPABASE_SERVICE_ROLE_KEY (only the dashboard
 * curator should be invoking this).
 */

import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

const CACHE_TAG = "geodetic-predictions";

export async function POST(request: NextRequest) {
    const auth = request.headers.get("authorization") ?? "";
    const expected = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`;
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: "service role key not configured" }, { status: 500 });
    }
    if (auth !== expected) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    revalidateTag(CACHE_TAG, "max");

    return NextResponse.json({
        ok: true,
        tag: CACHE_TAG,
        revalidatedAt: new Date().toISOString(),
    });
}
