import { createClient } from '@/lib/supabase/server'
import type { Profile, Search, PartnerProfile } from '@/lib/types/database'

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

// Save a destination search + score
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
    .limit(10) // added limit to prevent unbounded query
  return data ?? []
}
