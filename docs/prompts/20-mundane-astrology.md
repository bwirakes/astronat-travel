# Prompt 20 — Mundane Astrology (Country Charts)

**Phase:** 1 | **Priority:** P2

---

## Read These First

1. **`.agents/skills/astro-design/SKILL.md`** — Design system. Read fully before any UI work.
2. **`app/globals.css`** — CSS tokens. Never hardcode values.
3. **`docs/prompts/18-chart-wheel.md`** — ChartWheel component reused here.
4. **`docs/prompts/13-shared-components.md`** — Uses `Pill`, `VerdictLabel`, `ScoreRing`.
5. **`app/api/natal/`** — Natal calculation endpoint (used to compute country charts).

---

## What is Mundane Astrology?

Every country/city has a "natal chart" based on its founding date or constitution. When a user travels to or researches a destination, we can show:
1. The country's natal chart (Sun sign, Moon sign, Ascendant)
2. Synastry aspects between the user's natal chart and the country's chart
3. A composite "resonance score" (uses same VerdictLabel scale as readings)

---

## Step 1 — `lib/mundane-charts.ts`

Bundle curated founding data for the top 35 travel destinations.

```ts
export interface CountryChart {
  slug: string;
  name: string;
  flag: string; // emoji
  founding: string; // ISO 8601 datetime
  capital: { lat: number; lon: number; city: string };
  sunSign: string; // pre-computed for display
  note: string; // sourcing note
}

export const COUNTRY_CHARTS: CountryChart[] = [
  { slug: "japan", name: "Japan", flag: "🇯🇵", founding: "1947-05-03T00:00:00+09:00", capital: { lat: 35.68, lon: 139.69, city: "Tokyo" }, sunSign: "Taurus", note: "Japanese Constitution enacted" },
  { slug: "usa", name: "United States", flag: "🇺🇸", founding: "1776-07-04T17:10:00-05:00", capital: { lat: 38.90, lon: -77.03, city: "Washington D.C." }, sunSign: "Cancer", note: "Sibly Chart — Declaration of Independence" },
  { slug: "france", name: "France", flag: "🇫🇷", founding: "1958-10-04T00:00:00+01:00", capital: { lat: 48.85, lon: 2.35, city: "Paris" }, sunSign: "Libra", note: "5th Republic Constitution" },
  { slug: "germany", name: "Germany", flag: "🇩🇪", founding: "1949-05-23T00:00:00+01:00", capital: { lat: 52.52, lon: 13.40, city: "Berlin" }, sunSign: "Gemini", note: "Basic Law (Grundgesetz)" },
  { slug: "uk", name: "United Kingdom", flag: "🇬🇧", founding: "1801-01-01T00:00:00+00:00", capital: { lat: 51.50, lon: -0.12, city: "London" }, sunSign: "Capricorn", note: "Acts of Union — Great Britain + Ireland" },
  { slug: "australia", name: "Australia", flag: "🇦🇺", founding: "1901-01-01T13:35:00+10:00", capital: { lat: -33.87, lon: 151.21, city: "Sydney" }, sunSign: "Capricorn", note: "Federation Proclamation" },
  { slug: "india", name: "India", flag: "🇮🇳", founding: "1947-08-15T00:00:00+05:30", capital: { lat: 28.61, lon: 77.20, city: "New Delhi" }, sunSign: "Leo", note: "Independence from British rule" },
  { slug: "singapore", name: "Singapore", flag: "🇸🇬", founding: "1965-08-09T10:00:00+08:00", capital: { lat: 1.35, lon: 103.82, city: "Singapore" }, sunSign: "Leo", note: "Independence Declaration" },
  { slug: "uae", name: "UAE", flag: "🇦🇪", founding: "1971-12-02T00:00:00+04:00", capital: { lat: 25.20, lon: 55.27, city: "Dubai" }, sunSign: "Sagittarius", note: "UAE Union formed" },
  { slug: "spain", name: "Spain", flag: "🇪🇸", founding: "1978-12-29T00:00:00+01:00", capital: { lat: 41.38, lon: 2.17, city: "Barcelona" }, sunSign: "Capricorn", note: "Spanish Constitution" },
  { slug: "portugal", name: "Portugal", flag: "🇵🇹", founding: "1976-04-25T00:00:00+01:00", capital: { lat: 38.72, lon: -9.14, city: "Lisbon" }, sunSign: "Taurus", note: "Carnation Revolution — current republic" },
  { slug: "netherlands", name: "Netherlands", flag: "🇳🇱", founding: "1815-03-29T00:00:00+01:00", capital: { lat: 52.37, lon: 4.90, city: "Amsterdam" }, sunSign: "Aries", note: "Kingdom of the Netherlands established" },
  { slug: "denmark", name: "Denmark", flag: "🇩🇰", founding: "1849-06-05T00:00:00+01:00", capital: { lat: 55.68, lon: 12.57, city: "Copenhagen" }, sunSign: "Gemini", note: "Constitutional Monarchy established" },
  { slug: "mexico", name: "Mexico", flag: "🇲🇽", founding: "1821-09-28T00:00:00-06:00", capital: { lat: 19.43, lon: -99.13, city: "Mexico City" }, sunSign: "Libra", note: "Declaration of Independence" },
  { slug: "brazil", name: "Brazil", flag: "🇧🇷", founding: "1822-09-07T16:30:00-03:00", capital: { lat: -15.78, lon: -47.93, city: "Brasília" }, sunSign: "Virgo", note: "Cry of Ipiranga — Independence" },
  { slug: "argentina", name: "Argentina", flag: "🇦🇷", founding: "1816-07-09T00:00:00-03:00", capital: { lat: -34.60, lon: -58.38, city: "Buenos Aires" }, sunSign: "Cancer", note: "Declaration of Independence" },
  { slug: "south-africa", name: "South Africa", flag: "🇿🇦", founding: "1994-04-27T00:00:00+02:00", capital: { lat: -33.92, lon: 18.42, city: "Cape Town" }, sunSign: "Taurus", note: "First democratic election" },
  { slug: "turkey", name: "Turkey", flag: "🇹🇷", founding: "1923-10-29T20:30:00+03:00", capital: { lat: 41.01, lon: 28.95, city: "Istanbul" }, sunSign: "Scorpio", note: "Republic proclaimed by Atatürk" },
  { slug: "thailand", name: "Thailand", flag: "🇹🇭", founding: "1932-06-24T06:00:00+07:00", capital: { lat: 13.75, lon: 100.52, city: "Bangkok" }, sunSign: "Cancer", note: "Constitutional Monarchy established" },
  { slug: "indonesia", name: "Indonesia", flag: "🇮🇩", founding: "1945-08-17T10:00:00+07:00", capital: { lat: -8.34, lon: 115.09, city: "Bali" }, sunSign: "Leo", note: "Proclamation of Independence" },
];
```

---

## Step 2 — `app/components/MundaneCard.tsx`

A compact card showing a country's astrological identity:

```tsx
import { Pill } from './Pill';
import { VerdictLabel } from './VerdictLabel';
import { Globe } from 'lucide-react';

export function MundaneCard({ country, onClick }: { country: CountryChart; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        clipPath: 'var(--cut-sm)',
        background: 'var(--surface)', border: '1px solid var(--surface-border)',
        padding: 'var(--space-md)', textAlign: 'left', cursor: 'pointer',
        width: '100%', transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
        <span style={{ fontSize: '1.5rem' }}>{country.flag}</span>
        <div>
          <h4 style={{ fontFamily: 'var(--font-secondary)', fontSize: '1rem', margin: 0 }}>{country.name}</h4>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            {country.sunSign} Sun · Est. {new Date(country.founding).getFullYear()}
          </span>
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--text-tertiary)', margin: 0 }}>
        {country.note}
      </p>
    </button>
  );
}
```

---

## Step 3 — New Page: `app/mundane/page.tsx`

Route: `/mundane`

### Layout

```
[MUNDANE ASTROLOGY pill]
[Country Charts header — font-primary, uppercase]
[Search input to filter countries]
[Grid of MundaneCard — 2 col desktop, 1 col mobile]
[Click card → expands to show ChartWheel + synastry]
```

### Expanded Country View (on click)

```tsx
<div style={{ marginTop: 'var(--space-lg)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)' }}>
  <Pill>NATAL CHART — {country.name.toUpperCase()}</Pill>
  {/* Chart wheel — reuse ChartWheel component from prompt 18 */}
  <ChartWheel natal={countryNatalData} size={400} />

  {/* Synastry section */}
  <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-secondary)', marginTop: 'var(--space-lg)' }}>
    YOUR RESONANCE WITH {country.name.toUpperCase()}
  </h4>
  {/* Show 3-5 major synastry aspects in aspect rows */}
  {synastryAspects.map(a => (
    <div key={a.description} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--surface-border)' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600 }}>{a.description}</span>
      <VerdictLabel score={a.harmonyScore} />
    </div>
  ))}
</div>
```

---

## Step 4 — App Home Card

Add to the Explore section in `app/home/HomeClient.tsx`:

```tsx
{ 
  title: 'Country Charts', 
  icon: <Globe size={18} />, 
  description: 'Birth charts of nations',
  url: '/mundane', 
  accent: 'var(--color-acqua)' 
}
```

---

## Step 5 — Mundane Layer in Reading Results

In `app/reading/[id]/page.tsx`, add a new section below the house matrix:

```tsx
{/* Mundane Astrology Layer */}
{destinationCountry && (
  <section style={{ marginBottom: 'var(--space-2xl)' }}>
    <Pill>MUNDANE LAYER</Pill>
    <h3 style={{ fontFamily: 'var(--font-primary)', marginTop: 'var(--space-sm)' }}>
      {destinationCountry.name}'s Chart + Yours
    </h3>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>COUNTRY SUN</span>
        <p style={{ fontFamily: 'var(--font-secondary)', fontSize: '1.1rem', margin: '0.25rem 0 0' }}>{destinationCountry.sunSign}</p>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>FOUNDED</span>
        <p style={{ fontFamily: 'var(--font-secondary)', fontSize: '1.1rem', margin: '0.25rem 0 0' }}>{new Date(destinationCountry.founding).getFullYear()}</p>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>RESONANCE</span>
        <VerdictLabel score={mundaneResonanceScore} />
      </div>
    </div>
    <button
      style={{ marginTop: 'var(--space-md)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-acqua)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
      onClick={() => router.push(`/mundane?country=${destinationCountry.slug}`)}
    >
      See full country chart →
    </button>
  </section>
)}
```

---

## Country Chart Data API

When a country card is clicked, compute the country's natal chart by calling:

```ts
// POST /api/natal
// body: { birthDate: country.founding, lat: country.capital.lat, lon: country.capital.lon }
const countryNatal = await fetch('/api/natal', {
  method: 'POST',
  body: JSON.stringify({
    birthDate: country.founding,
    lat: country.capital.lat,
    lon: country.capital.lon,
  }),
});
```

This reuses the existing natal API — no new endpoints needed.

---

## Demo Mode (`?demo=true`)

- Show 6 MundaneCard entries pre-selected.
- Pre-expand "Japan" with a mock ChartWheel + 4 mock synastry aspects.
- Reading page shows the Mundane Layer with mock data for Tokyo, Japan.

---

## Design Checklist

- [ ] `lib/mundane-charts.ts` — 20+ curated country entries
- [ ] `MundaneCard` uses `clip-path: var(--cut-sm)`, flag emoji + country name
- [ ] `/mundane` page: search filter + expandable cards + `ChartWheel`
- [ ] App Home: "Country Charts" card with `Globe` icon + `var(--color-acqua)` accent
- [ ] Reading page: Mundane Layer section with 3 stat boxes + VerdictLabel + deep-link
- [ ] Country natal computed via existing `/api/natal` — no new endpoints
- [ ] Reading: only shows Mundane Layer if destination country exists in `COUNTRY_CHARTS`
- [ ] `?demo=true` supported on `/mundane` and `/reading`
- [ ] No hardcoded colors or fonts
