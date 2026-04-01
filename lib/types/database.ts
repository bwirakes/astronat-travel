export type Profile = {
  id: string
  first_name: string
  birth_date: string         // ISO date string "YYYY-MM-DD"
  birth_time: string         // "HH:MM:SS"
  birth_time_known: boolean
  birth_city: string
  birth_lat: number | null
  birth_lon: number | null
  life_goals: string[]
  created_at: string
  updated_at: string
}

export type Search = {
  id: string
  user_id: string
  destination: string
  dest_lat: number | null
  dest_lon: number | null
  travel_date: string | null
  travel_type: 'trip' | 'relocation'
  macro_score: number | null
  verdict: string | null
  score_detail: Record<string, unknown> | null
  created_at: string
}

export type PartnerProfile = {
  id: string
  owner_id: string
  label: string
  first_name: string
  birth_date: string
  birth_time: string
  birth_time_known: boolean
  birth_city: string
  birth_lat: number | null
  birth_lon: number | null
  created_at: string
}

export type Purchase = {
  id: string
  user_id: string
  stripe_session_id: string | null
  product: string
  created_at: string
}
