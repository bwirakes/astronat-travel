"use server";

import { createClient } from "@/lib/supabase/server";
import { createProfile, updateLifeGoals, saveSearch, getRecentSearches } from "@/lib/db";
import type { Profile, Search } from "@/lib/types/database";

// Create or update profile from authenticating user
export async function createProfileAction(birthData: { name: string, date: string, time: string, timeKnown: boolean, city: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const defaultProfile: Omit<Profile, "created_at" | "updated_at"> = {
      id: user.id,
      first_name: birthData.name,
      birth_date: birthData.date,
      birth_time: birthData.time || "12:00:00",
      birth_time_known: birthData.timeKnown,
      birth_city: birthData.city,
      birth_lat: null, // can be geocoded later
      birth_lon: null,
      life_goals: [],
    };
    const res = await createProfile(defaultProfile);
    return { data: res };
  } catch (error) {
    return { error: String(error) };
  }
}

export async function updateLifeGoalsAction(goals: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    await updateLifeGoals(user.id, goals);
    return { success: true };
  } catch (error) {
    return { error: String(error) };
  }
}

export async function saveSearchAction(searchData: { destination: string, lat?: number, lon?: number, travelDate?: string, travelType?: "trip" | "relocation", macroScore?: number, verdict?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const search: Omit<Search, 'id' | 'created_at'> = {
      user_id: user.id,
      destination: searchData.destination,
      dest_lat: searchData.lat || null,
      dest_lon: searchData.lon || null,
      travel_date: searchData.travelDate || null,
      travel_type: searchData.travelType || "trip",
      macro_score: searchData.macroScore || null,
      verdict: searchData.verdict || null,
      score_detail: null,
    };
    const res = await saveSearch(search);
    return { data: res };
  } catch (error) {
    return { error: String(error) };
  }
}

export async function getRecentSearchesAction(limit = 3) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  try {
    const res = await getRecentSearches(user.id, limit);
    return { data: res };
  } catch (error) {
    return { error: String(error) };
  }
}
