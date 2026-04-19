-- Geodetic pattern events: ingresses, stations, eclipses, lunations.
-- Populated by scripts/generate-geodetic-patterns.ts; read by /geodetic-patterns.

create table if not exists public.geodetic_events (
  id              bigserial primary key,
  utc             timestamptz      not null,
  jd              double precision not null,
  type            text             not null,
  body            text             not null,
  from_sign       text,
  to_sign         text,
  sign            text,
  lon             double precision,
  geodetic_zone   text,
  meta            jsonb,
  inserted_at     timestamptz      not null default now(),

  constraint geodetic_events_type_body_jd_uniq unique (type, body, jd)
);

create index if not exists geodetic_events_utc_idx        on public.geodetic_events (utc);
create index if not exists geodetic_events_type_idx       on public.geodetic_events (type);
create index if not exists geodetic_events_body_idx       on public.geodetic_events (body);
create index if not exists geodetic_events_zone_idx       on public.geodetic_events (geodetic_zone);

alter table public.geodetic_events enable row level security;

-- Read-only for anon + authenticated; writes via service role only.
create policy "geodetic_events read"
  on public.geodetic_events for select
  to anon, authenticated
  using (true);
