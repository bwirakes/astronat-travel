import { createAdminClient } from "../lib/supabase/admin";

const s = createAdminClient();
const { data } = await s.auth.admin.listUsers();
console.log("Users:", data.users.length);
for (const u of data.users.slice(0, 30)) console.log("  " + (u.email ?? "<no email>") + "  (id: " + u.id.slice(0, 8) + "...)");

const { data: profs } = await s.from("profiles").select("id, first_name, birth_date, birth_city").not("birth_date", "is", null).limit(20);
console.log("\nProfiles with birth data:");
for (const p of (profs ?? [])) console.log("  " + (p.first_name ?? "???") + " | " + p.birth_date + " | " + (p.birth_city ?? "") + " | id: " + p.id.slice(0, 8) + "...");

// Find readings in the Taketomi region for any user
const { data: readings } = await s.from("readings").select("id, user_id, reading_date, reading_score, details").like("details->>destination", "%aketomi%").limit(10);
console.log("\nReadings mentioning Taketomi:");
for (const r of (readings ?? [])) {
  console.log("  reading=" + r.id.slice(0, 8) + " user=" + r.user_id.slice(0, 8) + " date=" + r.reading_date.slice(0, 10) + " score=" + r.reading_score + " dest=" + (r.details as any)?.destination);
}
