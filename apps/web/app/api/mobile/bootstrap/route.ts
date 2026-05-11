import { NextResponse } from "next/server";

import { createBearerClient, readBearerToken } from "@/lib/supabase/bearer";

export async function GET(request: Request) {
  const token = readBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  const supabase = createBearerClient(token);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Invalid bearer token" }, { status: 401 });
  }

  const [{ data: profile }, { data: readings, count }, { data: subscription }] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, birth_date, birth_time, birth_city, birth_lat, birth_lon")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("readings")
      .select("id, category, details, reading_date, reading_score, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle(),
  ]);

  const readingsTotal = count ?? 0;
  const hasSubscription = !!subscription;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    access: {
      hasSubscription,
      freeUsed: readingsTotal >= 1,
      canRead: hasSubscription || readingsTotal < 1,
      readingsTotal,
    },
    readings:
      readings?.map((reading) => {
        const details = (reading.details ?? {}) as {
          destination?: string;
          weatherForecast?: { cities?: Array<{ label?: string }> };
        };

        return {
          id: reading.id,
          destination: details.destination ?? details.weatherForecast?.cities?.[0]?.label ?? "Unknown",
          score: reading.reading_score,
          kind: reading.category,
          createdAt: reading.created_at ?? reading.reading_date,
        };
      }) ?? [],
  });
}
