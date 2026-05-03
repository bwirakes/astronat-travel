import { createAdminClient } from "./lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();
  
  // 1. Get user by email
  // Auth users are trickier to get by email without admin listUsers
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Auth error:", authError);
    return;
  }
  
  const user = users.users.find(u => u.email === "test@astronat.local");
  if (!user) {
    console.log("User not found: test@astronat.local");
    return;
  }
  
  console.log("Found user:", user.id);
  
  // 2. Get profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  console.log("Profile:", profile?.first_name, profile?.birth_date, profile?.birth_time, profile?.birth_city);
  
  // 3. Get natal chart
  const { data: chart } = await supabase.from("natal_charts").select("*").eq("user_id", user.id).eq("chart_type", "natal").single();
  
  if (!chart || !chart.ephemeris_data) {
    console.log("No natal chart found for user.");
    return;
  }
  
  const eph = chart.ephemeris_data as any;
  const planets = eph.planets || [];
  const cusps = eph.cusps || [];
  
  console.log("Ascendant Longitude:", cusps[0]);
  console.log("Planets:", planets.map((p: any) => ({ name: p.name || p.planet, sign: p.sign, house: p.house, dignity: p.dignity })));
}

main().catch(console.error);
