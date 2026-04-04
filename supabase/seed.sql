-- ─── 1. Auth & Profile ──────────────────────────────────────────
-- Insert a test user into auth.users to satisfy Foreign Key constraints
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'builder@astronat.local', crypt('password123', gen_salt('bf')), now(), now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Insert corresponding profile
INSERT INTO public.profiles (id, first_name, last_name, birth_date, birth_time, birth_utc, birth_city, birth_lat, birth_lon, life_goals, is_subscribed)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Demo',
  'User',
  '1995-05-15',
  '14:30:00',
  '1995-05-15T14:30:00Z',
  'London, UK',
  51.5072,
  -0.1276,
  '["career", "growth"]',
  true
) ON CONFLICT (id) DO NOTHING;

-- ─── 2. Mock Readings (Translating UI MOCK_READING) ───────────
INSERT INTO public.readings (user_id, category, reading_date, reading_score, details)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'astrocartography',
  '2026-05-12T00:00:00Z',
  87,
  '{
    "destination": "Tokyo, Japan",
    "travelType": "trip",
    "planetaryLines": [
      { "planet": "Jupiter", "line": "MC", "distance": "78 km", "tier": "Strong" },
      { "planet": "Venus", "line": "DSC", "distance": "156 km", "tier": "Moderate" },
      { "planet": "Sun", "line": "ASC", "distance": "243 km", "tier": "Moderate" }
    ],
    "transitWindows": [
      { "start": "2026-05-01", "end": "2026-05-18", "transit": "Jupiter trine natal Sun", "type": "PERSONAL", "recommendation": "Peak window — book flights for this period." }
    ],
    "houses": [
      { "house": 1, "name": "Identity", "score": 82, "planet": "Mercury", "sign": "Gemini", "line": "ASC", "insight": "Strong communicative energy.", "tag": "PERSONAL" },
      { "house": 9, "name": "Exploration", "score": 95, "planet": "Jupiter", "sign": "Sagittarius", "line": "MC", "insight": "Peak energy for travel.", "tag": "PERSONAL" }
    ]
  }'::jsonb
);

-- ─── 3. Mundane Entities ──────────────────────────────────────
INSERT INTO public.mundane_entities (id, slug, name, flag_emoji, founding_date, founding_time, founding_utc, capital_lat, capital_lon)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'usa', 'United States', '🇺🇸', '1776-07-04', '17:10:00', '1776-07-04T22:10:00Z', 38.90, -77.03),
  ('33333333-3333-3333-3333-333333333333', 'japan', 'Japan', '🇯🇵', '1947-05-03', '00:00:00', '1947-05-02T15:00:00Z', 35.68, 139.69);

-- ─── 4. Natal Charts for Mundane Entities ─────────────────────
INSERT INTO public.natal_charts (entity_id, chart_type, ephemeris_data, house_placements)
VALUES 
  (
    '22222222-2222-2222-2222-222222222222', 
    'natal', 
    '{"Sun": "Cancer", "Moon": "Aquarius"}'::jsonb, 
    '{"Ascendant": "Sagittarius"}'::jsonb
  );
