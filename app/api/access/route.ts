import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReadingAccess } from "@/lib/access";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { hasSubscription: false, freeUsed: false, canRead: false, readingsTotal: 0, authenticated: false },
      { status: 200 },
    );
  }

  const access = await getReadingAccess(user.id);
  return NextResponse.json({ ...access, authenticated: true });
}
