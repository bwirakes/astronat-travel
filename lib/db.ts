import { createClient } from '@/lib/supabase/server'
import type { Profile, Search, PartnerProfile, Reading } from '@/lib/types/database'

// Get authenticated user's profile
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
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
  return data
}

// Update life goals
export async function updateLifeGoals(userId: string, goals: string[]): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({ life_goals: goals, updated_at: new Date().toISOString() })
    .eq('id', userId)
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

// Save a reading record
export async function saveReading(reading: Omit<Reading, 'id' | 'created_at'>): Promise<Reading | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('readings')
    .insert(reading)
    .select()
    .single()
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

// Get user's computed natal chart
export async function getNatalChart(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('natal_charts')
    .select('*')
    .eq('user_id', userId)
    .eq('chart_type', 'natal')
    .single()
  return data
}

// Save natal chart computation
export async function saveNatalChart(userId: string, ephemerisData: any, housePlacements: any) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('natal_charts')
    .insert({
      user_id: userId,
      chart_type: 'natal',
      ephemeris_data: ephemerisData,
      house_placements: housePlacements
    })
    .select()
    .single()
  return data
}
