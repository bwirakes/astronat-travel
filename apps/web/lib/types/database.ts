export type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  birth_date: string | null   // ISO date string "YYYY-MM-DD"
  birth_time: string           // "HH:MM:SS"
  birth_time_known: boolean
  birth_city: string | null
  birth_lat: number | null
  birth_lon: number | null
  birth_utc: string | null
  life_goals: string[]
  is_subscribed: boolean
  subscription_status: string | null
  subscription_id: string | null
  subscription_ends_at: string | null
  stripe_customer_id: string | null
  last_login_date: string | null
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

export type Reading = {
  id: string
  user_id: string
  partner_id: string | null
  category: 'natal' | 'synastry' | 'astrocartography' | 'solar_return' | 'mundane'
  reading_date: string
  reading_score: number | null
  details: Record<string, unknown>
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

export type Subscription = {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: string
  current_period_start: string | null
  current_period_end: string | null
  plan_id: string | null
  created_at: string
}
