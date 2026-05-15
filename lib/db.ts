import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile, Search, PartnerProfile, Reading } from '@/lib/types/database'

// Get authenticated user's profile. Cached per-user via unstable_cache; the
// admin client is used inside the cache fn (cookies are forbidden inside
// cached fns). Callers MUST pass an authenticated user.id — page-level
// auth gates this; admin bypasses RLS so a wrong userId would leak.
// Tag: `profile-<userId>`. Revalidated by createProfile/updateLifeGoals
// and the Stripe webhook (subscription status mirrors onto profile).
export async function getProfile(userId: string): Promise<Profile | null> {
  if (process.env.ASTRO_NAT_SCRIPT_DB === '1') {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data
  }

  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return data
    },
    [`profile-${userId}`],
    { tags: [`profile-${userId}`], revalidate: 300 }
  )()
}

// Fresh profile read for flows where correctness matters more than the
// short-lived profile cache, e.g. immediately after editing birth data and
// recomputing the natal chart.
export async function getProfileFresh(userId: string): Promise<Profile | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

// Create profile after first signup
export async function createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single()
  if (data) {
    const { revalidateTag } = await import('next/cache')
    revalidateTag(`profile-${profile.id}`, 'max')
  }
  return data
}

// Update life goals
export async function updateLifeGoals(userId: string, goals: string[]): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({ life_goals: goals, updated_at: new Date().toISOString() })
    .eq('id', userId)
  const { revalidateTag } = await import('next/cache')
  revalidateTag(`profile-${userId}`, 'max')
}

// Save a destination search (writes to both searches and readings for compat)
export async function saveSearch(search: Omit<Search, 'id' | 'created_at'>): Promise<Search | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('searches')
    .insert(search)
    .select()
    .single()
  return data
}

// Get recent searches for App Home
export async function getRecentSearches(userId: string, limit = 3): Promise<Search[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

// Save a reading record. Invalidates `access-<userId>` so the cached
// readingsTotal/freeUsed reflect the new row immediately — otherwise the
// upsell flag stays stale for up to the access cache's revalidate window
// (60s) after a user generates their first reading.
export async function saveReading(reading: Omit<Reading, 'id' | 'created_at'>): Promise<Reading | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('readings')
    .insert(reading)
    .select()
    .single()
  if (data) {
    const { revalidateTag } = await import('next/cache')
    revalidateTag(`access-${reading.user_id}`, 'max')
  }
  return data
}

// Get recent readings
export async function getRecentReadings(userId: string, limit = 10): Promise<Reading[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('readings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

// Save a partner profile
export async function savePartnerProfile(partner: Omit<PartnerProfile, 'id' | 'created_at'>): Promise<PartnerProfile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('partner_profiles')
    .insert(partner)
    .select()
    .single()
  return data
}

// Get partner profiles for couples flow
export async function getPartnerProfiles(ownerId: string): Promise<PartnerProfile[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('partner_profiles')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}

// Get subscription status — reads directly from profiles (fast boolean gating)
export async function getSubscriptionStatus(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('is_subscribed, subscription_status, subscription_ends_at')
    .eq('id', userId)
    .single()
  return data ? {
    status: data.subscription_status,
    current_period_end: data.subscription_ends_at,
    is_subscribed: data.is_subscribed,
  } : null
}

// Get partner's computed natal chart (cache-aside for couples readings)
export async function getPartnerNatalChart(partnerId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('natal_charts')
    .select('*')
    .eq('partner_id', partnerId)
    .eq('chart_type', 'natal')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

// Save partner natal chart computation
export async function savePartnerNatalChart(partnerId: string, ephemerisData: any, housePlacements: any) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('natal_charts')
    .insert({
      partner_id: partnerId,
      chart_type: 'natal',
      ephemeris_data: ephemerisData,
      house_placements: housePlacements,
    })
    .select()
    .single()
  return data
}

// Get user's computed natal chart. Cached per-user; tag `natal-<userId>`.
// Invalidated by saveNatalChart. The cache is a meaningful win because the
// chart page reads this on every visit and the underlying data only
// changes when the user's birth metadata changes (rare).
export async function getNatalChart(userId: string) {
  if (process.env.ASTRO_NAT_SCRIPT_DB === '1') {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('natal_charts')
      .select('*')
      .eq('user_id', userId)
      .eq('chart_type', 'natal')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data
  }

  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('natal_charts')
        .select('*')
        .eq('user_id', userId)
        .eq('chart_type', 'natal')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
    },
    [`natal-${userId}`],
    { tags: [`natal-${userId}`], revalidate: 3600 }
  )()
}

// Save natal chart computation (update existing row first, insert if none exists)
// Two-step so it works even if the unique constraint migration hasn't run yet.
export async function saveNatalChart(userId: string, ephemerisData: any, housePlacements: any) {
  if (process.env.ASTRO_NAT_SCRIPT_DB === '1') {
    const supabase = createAdminClient()
    const now = new Date().toISOString()
    const { data: updated, error: updateError } = await supabase
      .from('natal_charts')
      .update({
        ephemeris_data: ephemerisData,
        house_placements: housePlacements,
        updated_at: now,
      })
      .eq('user_id', userId)
      .eq('chart_type', 'natal')
      .select()
      .maybeSingle()

    if (!updateError && updated) return updated

    const { data } = await supabase
      .from('natal_charts')
      .insert({
        user_id: userId,
        chart_type: 'natal',
        ephemeris_data: ephemerisData,
        house_placements: housePlacements,
      })
      .select()
      .single()
    return data
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  // Try updating first (covers the common case where a row already exists)
  const { data: updated, error: updateError } = await supabase
    .from('natal_charts')
    .update({
      ephemeris_data: ephemerisData,
      house_placements: housePlacements,
      updated_at: now,
    })
    .eq('user_id', userId)
    .eq('chart_type', 'natal')
    .select()
    .maybeSingle()

  if (!updateError && updated) {
    const { revalidateTag } = await import('next/cache')
    revalidateTag(`natal-${userId}`, 'max')
    return updated
  }

  // No existing row — insert fresh
  const { data } = await supabase
    .from('natal_charts')
    .insert({
      user_id: userId,
      chart_type: 'natal',
      ephemeris_data: ephemerisData,
      house_placements: housePlacements,
    })
    .select()
    .single()
  const { revalidateTag } = await import('next/cache')
  revalidateTag(`natal-${userId}`, 'max')
  return data
}
