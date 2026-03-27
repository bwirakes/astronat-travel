# Astro Nat v3 — Full Computation Rubric

---

## ⚡ TLDR

Your trip score (0–100) answers: *"How well does this location support your life right now?"*

It works in **3 layers:**

1. **Score each of the 12 houses** (0–100 each) — a house is an area of life like career, travel, or relationships. Each house runs through 12 scoring steps using your natal chart, the destination's geography, current planetary positions, and parans.
2. **Group houses into 2 buckets** — the *Personal* bucket (who you are & how you live, worth up to 70pts) and the *Collective* bucket (the travel experience itself, worth up to 30pts).
3. **Add the buckets** → your final `macroScore`. A great score means the location works for *both* your personal life *and* the experience of being there.

A score of 80+ = **Highly Productive**. Below 35 = **Hostile** (avoid).

---

## Architecture

```
NATAL CHART + DESTINATION + TODAY'S SKY
              ↓
  ┌─────── 12 Houses ───────┐
  │  Each house: 0–100 pts  │
  │  via 12 scoring steps   │
  └─────────────────────────┘
         ↓              ↓
  ┌─ PERSONAL ─┐   ┌─ COLLECTIVE ─┐
  │ H1,2,4,5,  │   │  H3,6,8,9,  │
  │ 7,10,11    │   │  12          │
  │ max 70 pts │   │ max 30 pts   │
  └────────────┘   └─────────────┘
              ↓
        macroScore (0–100)
```

---

## What Goes Into Each Bucket?

### Personal / Standard Bucket (up to 70 pts)
These houses govern your experience as an individual at the destination — your identity, work, relationships, and resources.

| House | Weight | Theme |
|-------|--------|-------|
| H1 | 20% | **Identity & Vitality** — who you show up as abroad |
| H10 | 20% | **Career & Reputation** — public visibility, work opportunities |
| H7 | 15% | **Partnerships** — meetings, collaborations, romance |
| H4 | 15% | **Home & Foundation** — comfort, accommodation, belonging |
| H11 | 15% | **Networks & Community** — social connections, like-minded people |
| H5 | 10% | **Creativity & Pleasure** — leisure, art, fun |
| H2 | 5% | **Budget & Resources** — money flow while there |

### Collective / Travel Bucket (up to 30 pts)
These houses specifically describe the *travel experience* — journeys, foreign environments, shared resources, and daily routine abroad.

| House | Weight | Theme |
|-------|--------|-------|
| H9 | 40% | **Long Journeys** — international travel, foreign culture, Higher learning |
| H12 | 30% | **Foreign Lands** — solo retreats, long stays, emigration |
| H3 | 15% | **Short Trips** — day trips, communication, getting around |
| H8 | 10% | **Shared Resources** — shared costs, transformation, joint finances |
| H6 | 5% | **Health & Routine** — staying healthy, daily comfort |

> H9 dominates at 40% because it is the primary house of long-distance international travel. A bad H9 score alone can tank the entire Collective bucket.

---

## Aspect Angles Reference

An **aspect** is a specific geometric angle between two planets. It determines whether the planetary energies cooperate or clash. The angle is always measured in ecliptic longitude (0°–360° around the zodiac).

| Aspect | Symbol | Angle | Orb Allowed | Type | Example |
|--------|--------|-------|-------------|------|---------|
| **Conjunction** | ☌ | 0° | ±8° | Neutral (intensifies) | Sun at 15° Aries & Mars at 18° Aries = 3° apart ✓ |
| **Sextile** | ⚹ | 60° | ±6° | Harmonious | Venus at 10° Taurus & Mars at 70° Cancer = 60° apart ✓ |
| **Square** | □ | 90° | ±8° | Challenging | Saturn at 5° Capricorn & Sun at 5° Aries = 90° apart ✓ |
| **Trine** | △ | 120° | ±8° | Harmonious | Jupiter at 20° Sagittarius & Moon at 20° Aries = 120° apart ✓ |
| **Opposition** | ☍ | 180° | ±8° | Challenging | Mars at 0° Aries & Venus at 0° Libra = 180° apart ✓ |

### Worked Aspect Example

Mars is at **245°** (25° Sagittarius). Saturn is at **335°** (5° Pisces).

```
Angle between them = |335 − 245| = 90°
```

This is a **Square (□)** — an exact hard aspect at 0° orb. In transit scoring this would trigger a `-28 × 1.5 = −42` score hit on the affected house.

If Saturn were instead at **337°** (7° Pisces):
```
Angle = |337 − 245| = 92°  →  deviation from 90° = 2°  →  orb = 2°
```
Still a square, but with a 2° orb → multiplier drops to ×1.2 → score hit becomes `-28 × 1.2 = −34`.

---

## The 12 Scoring Steps (per house)

### Step 1 — Baseline Score

| House Type | Houses | Base |
|-----------|--------|------|
| Angular | 1, 4, 7, 10 | **55** |
| Succedent | 2, 5, 8, 11 | **50** |
| Cadent | 3, 6, 9, 12 | **45** |

Angular houses (the four "corners" of the chart — IC/Midheaven/Rising/Descending) naturally have the most power and volume, so they start higher.

```
baseScore = max(10, naturalBase − globalPenalty)
```

`globalPenalty` (0–25) is computed once from tense applying hard transits in today's sky:

| Condition | Penalty |
|-----------|---------|
| Malefic square/opposition, orb ≤ 1° | +14 |
| Malefic square/opposition, orb ≤ 2° | +10 |
| Malefic square/opposition, orb ≤ 3° | +6 |
| Non-malefic hard, orb ≤ 1° | +8 |
| Non-malefic hard, orb ≤ 3° | +4 |

> Example: Mars □ Jupiter (orb 1°, applying) = +14 global penalty. Every house starts 14 pts lower.

---

### Step 2 — Ruler Essential Dignity × Volume

Each house has a **ruler** (the planet that owns the zodiac sign on the house cusp). The ruler's strength is assessed by:
1. Its **essential dignity** — is it powerful or weak in the sign it currently occupies?
2. **Accidental dignity (volume)** — is the ruler in an angular, succedent, or cadent house?

```
dignityPts = essentialDignityScore × volumeMultiplier
```

**Essential Dignity Score:**

| Condition | Meaning | Score |
|-----------|---------|-------|
| **Domicile** | In its own sign (e.g., Mars in Aries) | **+15** |
| **Exalted** | In its peak sign (e.g., Venus in Pisces) | **+15** |
| **Peregrine** | No special relationship to the sign | **0** |
| **Detriment** | Opposite its home (e.g., Mars in Libra) | **-15** |
| **Fall** | Opposite its exaltation (e.g., Venus in Virgo) | **-15** |

**Volume Multiplier:**

| House Type | Multiplier |
|-----------|-----------|
| Angular (1,4,7,10) | **1.0** — full power |
| Succedent (2,5,8,11) | **0.75** — medium power |
| Cadent (3,6,9,12) | **0.5** — reduced power |

> Example: Jupiter rules H9 (a cadent house). Jupiter is in Sagittarius = Domicile (+15). Score = 15 × 0.5 = **+8**.  
> Contrast: Jupiter in Gemini = Detriment (−15). Score = −15 × 0.5 = **−8**. A weak ruler drags the whole house down.

---

### Step 3 — Occupant Planets

When natal planets physically sit *inside* a house in the relocated chart, they strongly colour that house's energy. Travel houses (3, 9, 12) get heightened modifiers because those planets are most activated by travel.

| Planet | Standard | In Travel House (3,9,12) |
|--------|----------|--------------------------|
| **Jupiter** | +25 | +30 |
| **Venus** | +18 | +20 |
| **Sun** | +15 | +18 |
| **Moon** | +10 | +10 |
| **Juno** | +8 | +10 |
| **North Node** | +8 | +8 |
| **Mercury** | +7 | +7 |
| **Neptune** | -5 | +8 (mystical abroad) |
| **Chiron** | -8 | -5 |
| **South Node** | -10 | -10 |
| **Uranus** | -14 | -18 |
| **Mars** | -18 | -22 |
| **Pluto** | -20 | -25 |
| **Saturn** | -25 | -30 |

> Example: Saturn occupies your relocated H9. That is −30 on top of everything else. Saturn literally delays, restricts, and makes travel feel burdensome. Capped at [-40, +40].

---

### Step 4 — ACG Line Proximity

AstroCartography (ACG) lines are curves on the world map showing where each natal planet rises (ASC), culminates (MC), sets (DSC), or hits the nadir (IC) on the horizon.

**Each line is mapped to its house:** MC → H10, IC → H4, ASC → H1, DSC → H7.

The closer you are to a line, the stronger its energy hits that house:

| Distance | Benefic Planet | Malefic Planet | Neutral |
|----------|---------------|---------------|---------|
| ≤ 80 km | **+30** | **-25** | +12 |
| 81–200 km | **+18** | **-15** | +8 |
| 201–400 km | **+10** | **-8** | +4 |
| 401–700 km | **+5** | **-4** | +2 |
| > 700 km | 0 | 0 | 0 |

Benefic: `Sun, Moon, Venus, Jupiter` — Malefic: `Mars, Saturn, Pluto, Uranus`

> Example: You're 95 km from your Venus MC line. Venus is a benefic, 81–200 km band → **+18** to H10 (Career). This is a significant career/reputation boost just from your geography.

Capped at **[-35, +35]**.

---

### Step 5 — Geodetic Grid Alignment

The Geodetic system is a fixed, permanent projection of the zodiac onto Earth's surface — regardless of what year or time it is:
- **Geodetic MC** = the destination's longitude converted directly to zodiac degrees (e.g., −74° W New York ≈ 106° ecliptic = Gemini MC)
- **Geodetic ASC** = calculated from longitude + latitude using the terrestrial obliquity formula

The engine checks if any of your natal planets sit close to these fixed geodetic angles. A tight hit means the Earth's own grid permanently "resonates" with your chart at that location.

**Angles checked:** Geo-MC (H10), Geo-IC (H4), Geo-ASC (H1), Geo-DSC (H7)

| Orb to Geodetic Angle | Benefic Planet | Malefic Planet | Neutral |
|-----------------------|---------------|---------------|---------|
| ≤ 2° | **+18** | **-18** | +7 |
| 2.1–5° | **+8** | **-8** | +3 |
| > 5° | 0 | 0 | 0 |

> Example: Your natal Jupiter is at 240° (20° Sagittarius). The geodetic MC of Bali (115°E) ≈ 235° (25° Scorpio). Diff = 5°, just at the outer edge → +8 to H10. Unlike ACG lines, this never changes — Bali will always slightly activate your Jupiter at the MC.

---

### Step 6 — Transits

Transits are the aspects today's planets (current sky positions) form to your natal planets. They represent the *timing* influence of the cosmos right now.

```
transitPts = Σ (baseImpact × orbMultiplier × applyingMultiplier)
```

| Factor | Value |
|--------|-------|
| Benefic transit base | +25 |
| Malefic transit base | -28 |
| Orb ≤ 1° | ×1.5 (exact — very loud) |
| Orb ≤ 2° | ×1.2 |
| Orb > 2° | ×1.0 |
| Applying (moving toward exact) | ×1.0 (full strength) |
| Separating (moving away) | ×0.4 (fading) |

> **Worked example (benefic):**  
> Today: Jupiter at 55° (Taurus) △ your natal Sun at 175° (Virgo) = 120° = Trine ✓  
> Orb = |120 - (175−55)| = 0° → exact → orb ≤ 1°  
> Score = +25 × 1.5 × 1.0 = **+38** to whichever house your natal Sun lands in.

> **Worked example (malefic):**  
> Today: Saturn at 350° (Pisces) □ your natal Moon at 100° (Cancer)  
> Angle = |350−100| = 250° → take the shorter arc → 360−250 = 110°. Not a square.  
> If instead Saturn at 10° (Aries) □ Moon at 100° (Cancer): |10−100|= 90° → Square ✓  
> Orb = 0° → score = −28 × 1.5 = **−42** (but capped at −45).

Capped at **[-45, +40]**.

---

### Step 7 — Natal Retrograde

If the **ruler of this house** was **retrograde** at your birth, it is introspective and less outwardly expressive.

**-8 pts** to the house.

> Example: Mercury rules your H3 (communication) and was retrograde in your natal chart. Your relocation communication style is more internal and prone to delays. -8 to H3.

---

### Step 8 — Transit Retrograde

If the planet that currently **rules this house** is retrograde in today's sky, its energy is reversed and internalized.

**-20 pts** to the house.

> Example: Venus rules your relocated H7 (partnerships). Venus is currently Rx in the sky. All partnership and relationship energy at this location is tangled, revisiting the past, not forward-moving. -20 to H7.

---

### Step 9 — Parans (Nuanced)

A **paran** is when two planets share the same latitude on Earth's surface — crossing the MC, IC, ASC, or DSC at the same moment. Unlike ACG lines (which follow curves), parans form horizontal bands across the globe at specific latitudes.

Only active if the paran latitude is **within 1° of your destination's latitude**.

**Step 1 — Check known combination ratings:**

Benefic combos (select):

| Combo | Base | Why |
|-------|------|-----|
| Jupiter + Venus | +18 | Peak prosperity & pleasure |
| Moon + Jupiter | +18 | Emotional expansion, luck |
| Jupiter + Sun | +15 | Vitality, success, recognition |
| Sun + Venus | +15 | Charm, creative flow |
| Jupiter + North Node | +15 | Karmic growth & expansion |
| Moon + Sun | +12 | Wholeness, strong life force |
| Jupiter + Saturn | +8 | Dignified structure, long-term gains |

Malefic combos (select):

| Combo | Base | Why |
|-------|------|-----|
| Mars + Saturn | -18 | The worst — accidents, obstacles, violence |
| Mars + Pluto | -18 | Explosive destruction |
| Moon + Pluto | -18 | Emotional devastation |
| Moon + Saturn | -15 | Depression, emotional restriction |
| Pluto + Venus | -15 | Obsession, manipulation, upheaval |

**Step 2 — Dignity modifiers:**

| Condition | Multiplier |
|-----------|-----------|
| Both planets dignified (benefic combo) | ×1.3 |
| Either planet afflicted (benefic combo) | ×0.6 |
| The malefic planet is dignified (malefic combo) | ×0.4 — softened |
| Paran lat within 0.3° of dest | ×1.2 — tighter band = stronger |

**Saturn Exception:** If Saturn is Domicile (Capricorn/Aquarius) or Exalted (Libra), it flips from malefic to **+5** stability bonus when paired with a non-malefic planet. A well-dignified Saturn in a paran = structure and endurance, not restriction.

**Generic fallback (unknown combos):**

| Scenario | Score |
|----------|-------|
| Benefic + trine/sextile + dignified | up to +22 |
| Benefic only | +15 |
| Malefic + square/opposition + afflicted | down to -25 |
| Malefic only | -18 |
| Mixed + harmonious | +5 |
| Mixed + challenging | -8 |

Capped at **[-30, +25]** per house.

---

### Step 10 — Natal → Relocated House Bridge

When you move to a new location, planets shift into different houses than they occupied at birth. The natal house theme "channels through" the relocated house — sometimes synergistically, sometimes awkwardly.

**House clusters (for bridge synergy scoring):**

| Cluster | Houses | Themes |
|---------|--------|--------|
| Travel | 3, 9, 12 | Journeys, foreign lands, short trips |
| Career/Material | 2, 6, 10 | Money, work, daily output |
| Relationship | 5, 7, 11 | Romance, partners, community |

| Condition | Modifier |
|-----------|---------|
| Same cluster (e.g., H9 → H3) + benefic planet | **+8** |
| Same cluster + neutral planet | **+5** |
| Same cluster + malefic planet | **-3** |
| Different cluster + benefic | **+3** |
| Different cluster + malefic | **-2** |
| Different cluster + neutral | **+1** |
| Same house (no shift) | **0** |

> Example: Natal Venus in H8 (intimacy, shared resources). At the destination, Venus falls in H3 (communication, short trips). H8 and H3 are in different clusters → cross-context + benefic = **+3** to H3.  
> Better example: Natal Jupiter in H12 (foreign lands). Relocated to H9 (long journeys) — both are travel cluster → synergy + benefic = **+8** to H9. Jupiter's foreign-lands energy is perfectly channelled by the long-journey house.

Capped at **[-15, +15]**.

---

### Step 11 — Lot of Fortune / Spirit

The Arabic Parts (Lots) are **sensitive points** computed from your Ascendant, Sun, and Moon longitude. They shift based on sect (day vs. night birth):

```
Day birth  (Sun above horizon, offset ≥ 180°):
  Fortune = ASC + Moon − Sun
  Spirit  = ASC + Sun  − Moon

Night birth (Sun below horizon, offset < 180°):
  Fortune = ASC + Sun  − Moon
  Spirit  = ASC + Moon − Sun
```

When a Lot lands in a relocated house, it adds a meaningful bonus:

| Lot | Bonus | Meaning |
|-----|-------|---------|
| **Lot of Fortune** | **+12** | Material luck, physical wellbeing, prosperity |
| **Lot of Spirit** | **+8** | Purpose, willpower, spiritual direction |
| Both in same house | **+20** | Rare — extremely auspicious for that life area |

> Example: ASC = 0°, Sun = 200° (day birth), Moon = 100°.  
> Fortune = 0 + 100 − 200 = −100 → normalized = **260°** (20° Sagittarius) → H9.  
> H9 gets an extra +12 — Fortune literally placed in the travel house.

---

### Step 12 — Final Clamp

```
houseScore = clamp(0, 100, sum of all 11 components above)
```

A house can never go below 0 or above 100, regardless of how extreme the inputs are.

---

## Macro Score Decomposition

### Personal Score Formula
```
personalScore = round(
    (H1×0.20 + H10×0.20 + H7×0.15 + H4×0.15 + H11×0.15 + H5×0.10 + H2×0.05)
    × 70
)
```

### Collective Score Formula
```
collectiveScore = round(
    (H9×0.40 + H12×0.30 + H3×0.15 + H8×0.10 + H6×0.05)
    × 30
)
```

### Final Score
```
macroScore = min(100, personalScore + collectiveScore)
```

### Verdict Labels

| Score | Verdict |
|-------|---------|
| ≥ 80 | **Highly Productive** |
| 65–79 | **Productive** |
| 50–64 | **Mixed** |
| 35–49 | **Challenging** |
| < 35 | **Hostile** |

---

## Full Worked Example 1: Favorable — NYC Birth → Bali

### Chart Setup
| Field | Value |
|-------|-------|
| Birth | NYC (40.7°N) → **Placidus** selected (|40.7| < 66) |
| Destination | Bali (−8.65°S, 115.2°E) |
| Paran latitude | Jupiter + Venus paran at −8.8° → within 1° of −8.65° ✓ |

**Key natal planets:**

| Planet | Sign | Longitude | Dignity |
|--------|------|-----------|---------|
| Jupiter | Sagittarius | 260° | Domicile |
| Venus | Taurus | 42° | Domicile |
| Saturn | Capricorn | 290° | Domicile |

**Today's sky:** Venus △ natal Jupiter (120° trine, orb 1°, applying).  
**ACG:** Venus MC at 100 km. Jupiter ASC at 350 km.  
**Lot of Fortune:** 260° → relocates to H9.  
**Global penalty:** 0 (no tense applying hard transits today).

### House 9 (Travel) — Step-by-Step

| Step | Factor | Calculation | Pts |
|------|--------|-------------|-----|
| 1 | Base | Cadent (45) − 0 | **45** |
| 2 | Dignity | Jupiter Domicile (+15) × cadent (0.5) | **+8** |
| 3 | Occupants | Jupiter in H9 (travel house modifier) | **+30** |
| 4 | ACG | Jupiter ASC 350 km → H1, not H9 | **0** |
| 5 | Geodetic | No natal planets hit Bali's geo angles at H9 cusp | **0** |
| 6 | Transit | Venus △ Jupiter: +25 × 1.5 (orb≤1°) × 1.0 (applying) | **+38** |
| 7 | Natal Rx | Jupiter not Rx natally | **0** |
| 8 | Transit Rx | No H9 ruler Rx in sky | **0** |
| 9 | Paran | Jupiter+Venus known (+18), both dignified ×1.3 = 23 → cap 22 | **+22** |
| 10 | Bridge | Jupiter natal H9 → relocated H9 = no shift | **0** |
| 11 | Lot | Lot of Fortune at 260° lands in H9 | **+12** |
| 12 | **Clamp** | 45+8+30+38+22+12 = 155 → **100** | **100** |

### House 10 (Career) — Step-by-Step

| Step | Factor | Calculation | Pts |
|------|--------|-------------|-----|
| 1 | Base | Angular (55) − 0 | **55** |
| 2 | Dignity | Saturn Domicile (+15) × angular (1.0) | **+15** |
| 3 | Occupants | Saturn in H10 (standard) | **-25** |
| 4 | ACG | Venus MC 100 km → H10, benefic | **+18** |
| 5 | Geodetic | — | **0** |
| 6 | Transit | None targeting H10 | **0** |
| 9 | Paran | Same Jupiter+Venus paran | **+22** |
| 10 | Bridge | Venus natal H2 → relocated H10, cross-context, benefic | **+3** |
| 11 | Lot | — | **0** |
| 12 | **Clamp** | 55+15−25+18+22+3 = **88** | **88** |

### Final Score

| Bucket | Houses & Scores | Weighted | Result |
|--------|----------------|----------|--------|
| Personal | H1=55, H10=88, H7=50, H4=65, H11=48, H5=55, H2=45 | 11+17.6+7.5+9.75+7.2+5.5+2.25 = 60.8 | **43** |
| Collective | H9=100, H12=48, H3=50, H8=45, H6=50 | 40+14.4+7.5+4.5+2.5 = 68.9 | **21** |
| **macroScore** | 43 + 21 | | **64 — Mixed** |

> H9 maxes out at 100, but the score stays a "Mixed" because Saturn occupying H10 drags that house to 88 rather than higher, and several mid-range houses pull the personal average down. The scoring is intentionally holistic — one great house doesn't make a perfect trip.

---

## Full Worked Example 2: Hostile — London Birth → Reykjavik

### Chart Setup
| Field | Value |
|-------|-------|
| Birth | London (51.5°N) → **Placidus** selected |
| Destination | Reykjavik (64.1°N, −21.9°W) |
| Global penalty | Mars □ Moon orb 2° (+10) + Saturn ☍ Sun orb 3° (+4) = **14** |

**Key natal planets:**

| Planet | Sign | Longitude | Dignity |
|--------|------|-----------|---------|
| Mars | Cancer | 95° | Fall |
| Saturn | Cancer | 100° | Detriment |
| Jupiter | Gemini | 75° | Detriment |
| Moon | Capricorn | 280° | Detriment |

**ACG:** Saturn MC at 150 km. Mars IC at 250 km.  
**Parans at lat 64.x°:** Mars + Saturn, Moon + Pluto.

### House 10 (Career) — Step-by-Step

| Step | Factor | Calculation | Pts |
|------|--------|-------------|-----|
| 1 | Base | Angular (55) − globalPenalty (14) | **41** |
| 2 | Dignity | Moon rules Cancer on H10 cusp. Detriment (−15) × 1.0 | **-15** |
| 3 | Occupants | Moon in H10 | **+10** |
| 4 | ACG | Saturn MC 150 km → H10, malefic | **-15** |
| 5 | Geodetic | — | **0** |
| 6 | Transit | Mars □ Moon: −28 × 1.2 (orb 2°) × 1.0 (applying) | **-34** |
| 7 | Natal Rx | Moon not Rx | **0** |
| 8 | Transit Rx | — | **0** |
| 9 | Paran | Mars+Saturn (−18) + Moon+Pluto (−18) = −36 → cap | **-30** |
| 10 | Bridge | — | **0** |
| 11 | Lot | — | **0** |
| 12 | **Clamp** | 41−15+10−15−34−30 = −43 → **0** | **0** |

H10 = **0**. The career house is completely dead. Five cascading negatives compound each other.

### House 9 (Travel) — Step-by-Step

| Step | Factor | Calculation | Pts |
|------|--------|-------------|-----|
| 1 | Base | Cadent (45) − 14 | **31** |
| 2 | Dignity | Jupiter in Gemini = Detriment (−15) × 0.5 | **-8** |
| 3 | Occupants | No planets in H9 | **0** |
| 9 | Paran | Same −30 (paran applies at this lat) | **-30** |
| 10 | Bridge | Venus natal H12 → relocated H9: travel synergy + benefic | **+8** |
| 12 | **Clamp** | 31−8−30+8 = **1** | **1** |

### Final Score

| Bucket | Houses & Scores | Weighted | Result |
|--------|----------------|----------|--------|
| Personal | H1=20, H10=0, H7=60, H4=25, H11=45, H5=50, H2=40 | 4+0+9+3.75+6.75+5+2 = 30.5 | **21** |
| Collective | H9=1, H12=35, H3=40, H8=30, H6=45 | 0.4+10.5+6+3+2.25 = 22.15 | **7** |
| **macroScore** | 21 + 7 | | **28 — Hostile** |

> The double malefic ACG lines (Saturn MC + Mars IC) hitting two angular houses, combined with afflicted parans and a global penalty from today's hard transits, produce a totalcascade failure. Even the natal bridge can't rescue it.

---

## How Travel Dates Affect the Score

Your natal chart, ACG lines, geodetic grid, parans, and Lot positions are all **fixed** — they don't change based on when you travel. What *does* change is today's sky.

Exactly **two** components are date-sensitive:

| Component | Date-Dependent? | Why |
|-----------|----------------|-----|
| Steps 1–5, 7, 10, 11 | ❌ No | Based on natal chart + geography |
| **Step 1 Global Penalty** | ✅ Yes | Derived from today's applying hard transits |
| **Step 6 Transits** | ✅ Yes | Today's planets aspecting your natal chart |
| Step 8 Transit Rx | ✅ Yes | Is the ruler retrograde *right now* in the sky? |

This means the **same person, same destination, different dates** can produce very different scores.

### Worked Date Comparison — Same Person, Same Destination

**Person:** Moon in Cancer at 100°. Jupiter rules H9, placed in Sagittarius.  
**Destination:** Bali (−8.65°S, 115.2°E)

#### Date A — March 23, 2026 (favorable sky)

| Today's Transit | Aspect | Orb | Applying? | Score Hit |
|----------------|--------|-----|-----------|-----------|
| Jupiter △ natal Moon | Trine (120°) | 1° | Yes | +25 × 1.5 × 1.0 = **+38** |
| Venus △ natal Jupiter | Trine (120°) | 1° | Yes | +25 × 1.5 × 1.0 = **+38** |

No hard applying transits → **globalPenalty = 0**

→ H9 base starts at **45**. Transit contribution: **+38**. Final H9 ≈ **100**.

#### Date B — September 15, 2026 (tense sky)

| Today's Transit | Aspect | Orb | Applying? | Score Hit |
|----------------|--------|-----|-----------|-----------|
| Saturn □ natal Moon | Square (90°) | 2° | Yes | −28 × 1.2 = **−34** |
| Mars ☍ natal Jupiter | Opposition (180°) | 1° | Yes | −28 × 1.5 = **−42** (capped −45) |

Both are malefic applying hard transits:  
`globalPenalty = +10 (Saturn □, orb 2°) + +14 (Mars ☍, orb 1°) = 24` — nearly the max.

→ H9 base starts at `45 − 24 = **21**`. Transit contribution: `−34 + −45 = −79 → capped −45`. Final H9 = `21 − 8 − 45 = −32 → clamped` **0**.

#### Side-by-Side Comparison

| | Date A (Mar 23) | Date B (Sep 15) |
|--|-----------------|-----------------|
| Global penalty | 0 | 24 |
| H9 transit pts | +38 | −45 |
| H9 final score | 100 | 0 |
| macroScore | ~64 | ~20 |
| Verdict | **Mixed** | **Hostile** |

> Same person. Same city. Bali in March is Mixed — Bali in September is Hostile. The locations's natal/geographic factors (ACG, geodetic, parans) are identical both times. **The date is what determines the timing quality.**

### How the 12-Month Windows Use This

The **12-Month Travel Windows** feature runs this exact computation for the 1st of each month. It loops through 12 consecutive months, fetches the world sky for each date, and re-scores the same destination. The result is a month-by-month **quality calendar** showing when a location is at its best and worst for you specifically.

