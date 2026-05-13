export const ORIGINAL_STATS_HTML = `<div class="section-hdr">MATHEMATICAL FRAMEWORK — v2.1</div>
    <div class="card">
      <div class="card-title">PSS Formula — Two-Phase Extended Model</div>
      <div class="formula">
PHASE 1 — Potential Setter score:<br>
PSS_base = Σᵢ [ wᵢ × pᵢ ]          (all techniques excluding Phase 2 trigger)<br>
OOB_score = ( |declination| − 23.43 ) / 6.57     [clamped 0–1]<br>
PSS_phase1 = PSS_base × (1 + max_OOB_score)       [multiplicative]<br>
<br>
PHASE 2 — Trigger bonus (added when active):<br>
PSS_trigger = Mars × 0.15 | Sun × 0.08 | Inner ingress × 0.06 | Moon OOB × 0.05<br>
<br>
PSS_final = min(1.0, PSS_phase1 + PSS_trigger)<br>
<br>
v4.0 ADDITIONS — Koch/Transpluto + World Axis + Hot Zones + Geophysical:<br>
Koch_cusp_score = 0.22 (≤1° orb) | 0.14 (≤3° orb)   [Koch geodetic ASC/MC/IC/DC]<br>
Transpluto_cusp = 0.14 (≤3° orb)   [⚠ verify Transpluto position in ephemeris]<br>
Midpoint_cusp   = 0.10 (≤3° orb)   [planet-pair midpoint ☌ Koch cusp]<br>
World_pt_station = 0.20  |  World_pt_eclipse = 0.20  |  WP_fast_planet = 0.10<br>
Cardinal_0deg       = +0.10 per planet/eclipse at 0°♈♋♎♑ (world point ingress)<br>
Hot_zone_modifier  = +0.06 per planet/eclipse in 20–28° cardinal OR 0–5° fixed OR 15° fixed<br>
Geophys_22_29tau   = +0.10 for EQ/volcano events (planets at 22–29°♉; +0.15 if Uranus)<br>
Mid_cardinal_12_14 = +0.08 (storm trigger, stacks with Hot_zone if applicable)<br>
Mid_mutable_10_15  = +0.06 (atmospheric pressure / maritime)<br>
<br>
v5.0 ADDITIONS — T16 Zodiacal Star Activation + BML Anaretic:<br>
T16_zod_exact   = +0.12  [Uranus/Neptune ≤1° of star's zodiacal position]<br>
T16_zod_wide    = +0.08  [Uranus/Neptune ≤3° of star's zodiacal position]<br>
T16_anaretic    = +0.10  [Uranus at 28°–29° fixed sign — stacks with star score]<br>
BML_anaretic_fx = +0.06  [BML at 28°–29° Taurus/Leo/Scorpio/Aquarius]<br>
BML_star_conj   = +0.04  [BML within 2° of fixed star zodiacal — adds to above]<br>
Key star zodiacal: Scheat 29°22'♓ · Algol 26°10'♉ · Antares 9°57'♐ · Aldebaran 9°57'♊ · Pollux 23°13'♊<br>
Validated T16 cases: Japan 2011 (Uranus 29°♓/Scheat ✓) · LA fires 2025 (Uranus 23°♉/Algol 3° orb ✓) · Morocco 2026 (Uranus 27°27'♉/Algol 1°17' ✓) · Japan Sanriku 2026 (Uranus 29°♉ anaretic ✓)<br>
<br>
v6.0 ADDITIONS — T17 Eclipse Axis/Nodal Stress + T18 Dwarf Bodies + T19 Lunation Triggers:<br>
T17_node_angle  = +0.15  [Node ☌ geodetic MC/IC/ASC/DC ≤3°]<br>
T17_node_bend   = +0.10  [Node □ geodetic angle ≤3° — nodal bending]<br>
T17_node_h2h8   = +0.12  [Node ☌ Placidus H2 or H8 ≤3° — resource disruption]<br>
T17_malefic_nod = +0.15  [Mars/Saturn/Pluto ☌ N.Node or S.Node ≤4°]<br>
T17_planet_nod  = +0.10  [Jupiter ☌ Node ≤4°] | +0.08 [Any planet □ Node ≤4°]<br>
T17_mp45        = +0.06  [Planet-pair midpoint ±45° from geodetic angle ≤2° orb]<br>
T18_chiron_ang  = +0.10  [Chiron ☌ geodetic angle ≤3°] | +0.07 [≤5°]<br>
T18_eris_ang    = +0.10  [Eris ☌ geodetic angle ≤3°] | +0.07 [≤5°]<br>
T18_body_fast   = +0.08  [Chiron/Eris aspected by fast planet at geodetic angle ≤5°]<br>
T19_nm_angle    = +0.12  [New Moon ☌ geodetic angle ≤5°]<br>
T19_fm_angle    = +0.10  [Full Moon ☌ geodetic angle ≤5°]<br>
T19_lunation_7d = +0.06  [Any lunation within ±7 days of event — timing modifier]<br>
T19_eclipse_deg = +0.10  [Lunation at active eclipse degree ±3°]<br>
T19_node_stack  = +0.08  [Lunation ☌ planet with nodal stress (T17 compound)]<br>
T19_moon_angle  = +0.08  [Moon transits local geodetic MC/IC/ASC within ±24h — intra-day timing trigger]<br>
40yr validation: 36/36 events (100%) ≥1 new-criteria hit · 30/36 (83%) nodal involvement · 32/36 (89%) lunation ±10d<br>
<br>
v7.0 ADDITIONS — T20 ASC Lines + T21 Ring of Fire/S.Hem + T22 El Niño:<br>
T20_asc_line    = +0.14  [Planet ASC line at event latitude ≤3° (calculate in ACG at actual lat)]<br>
T20_asc_wide    = +0.09  [Planet ASC line at event latitude ≤5°]<br>
T20_volcano_pluto = +0.14 [Pluto Rx/D station ≤7 days + target on volcanic arc (volcano events only)]<br>
T21_rof_mult    = ×1.25  [Any planetary line within 5° of Ring of Fire subduction/volcanic arc]<br>
T21_shem_cyc    = +0.08  [Southern hemisphere cyclone season modifier: Nov–Apr, 5°S–25°S, 80°E–180°E]<br>
T22_elnino_ic   = +0.10  [Outer planet IC line in Niño 3.4 zone (120°W–170°W) = planet at 0°♍–0°♑]<br>
T22_jup_nep     = +0.08  [Jupiter☌/□/☍Neptune within ±6 months — oceanic expansion cycle]<br>
T22_sat_nep_hard= +0.10  [Saturn sq or ☍ Neptune within ±24 months — Walker Circulation disruption]<br>
v7.0 validation: Kamchatka 2025 (T20 ASC) · Dukono 2026 (T20 volcano) · Narelle 2026 (T21×2) · El Niño 6/6 events (T22)<br>
<br>
v7.1 ADDITIONS — T23 Weather Event Amplifiers:<br>
T23a_hurricane_axis = +0.10  [Eclipse/station in Cancer or Capricorn signs — cardinal moisture/cold axis]<br>
T23a_2nd8th_stack  = +0.12  [T23a active AND eclipse triggers city's geodetic 2nd or 8th house — compound]<br>
T23b_2nd8th_house  = +0.10  [Eclipse or outer planet station in city's geodetic whole-sign 2nd or 8th house]<br>
T23b_wide          = +0.08  [Eclipse/station within 5° of 2nd/8th house cusp (not full sign)]<br>
T23c_anom_mars     = +0.08  [Anomalous Mars: |decl_actual − decl_expected| &gt;3° — requires manual ephemeris check]<br>
T23d_neptune_amp   = +0.07  [Neptune ≤5° of city geodetic angle OR active eclipse degree — oceanic amplifier]<br>
T23d_jupiter_mag   = +0.06  [Jupiter ≤5° of active eclipse degree — magnifier (not protector in mundane context)]<br>
T23d_uranus_amp    = +0.07  [Uranus ≤5° of eclipse degree OR hard aspect to eclipse chart ruler]<br>
T23e_station_ecl   = +0.09  [Planet stationary within ±3 days AND within 3° of eclipse degree — static pressure]<br>
T23f_elnino_ext    = +0.05  [T22 active compound bonus: El Niño confirmed + eclipse ≥3min total duration]<br>
<br>
v7.5 ADDITION — T25 McRae World Axis:<br>
T25_world_axis     = +0.10  [Eclipse or malefic ≤3° of 0°♈/♋/♎/♑ World Axis — global-scale amplifier]<br>
T25_house_6th12th  = +0.08  [Malefic ≤3° of 6th/12th equal-house cusp — hidden/epidemic domain]<br>
T25_house_3rd9th   = +0.07  [Malefic ≤3° of 3rd/9th equal-house cusp — transport/aviation domain]<br>
McRae angle domain: MC=gov/reputation · ASC=collective/public · IC=geology/infrastructure · DSC=foreign conflict<br>
World Axis verified: Sichuan 2008 (Pluto 0.8° WA ✓) · 9/11 (Mars 1.2° WA ✓) · Paris attacks (Mars 0.1° from 0°♎ ✓)<br>
Geodetic 2nd house: 1st house = sign containing geodetic ASC (whole-sign overlay). 2nd = next sign. 8th = 7 signs from ASC.<br>
Anomalous Mars note: decl_expected = arcsin(sin(ε)×sin(lon)). Divergence &gt;3° = Mars out-of-bounds for its longitude = wind shear spike.<br>
T23 validation: Katrina 2005 (New Orleans 8th=♏, lunar ecl 4°♏ ✓) · Yasi 2011 (Queensland 8th=♑, solar ecl 13°♑ ✓)<br>
<br>
v7.6 ADDITION — T26 Validated Midpoint Pairs (183-event dataset, ≤3° orb):<br>
T26a_venus_neptune   = +0.08  [MP(♀/♆) ≤5° geodetic angle — flood/dissolution amplifier; 4 hits, avg orb 1.06°]<br>
T26b_mars_uranus     = +0.08  [MP(♂/♅) ≤5° geodetic angle — sudden violent event; SF 1906 MC 2.9°, Hamas DSC 0.4°]<br>
T26c_mars_pluto      = +0.07  [MP(♂/♇) ≤5° geodetic angle — volcanic/mass violence; validate in ACG software]<br>
T26d_jupiter_neptune = +0.07  [MP(♃/♆) ≤5° geodetic angle — storm intensifier; Harvey MC 1.8°, Ian DSC 1.5°]<br>
T26e_uranus_pluto    = +0.06  [MP(♅/♇) ≤5° geodetic angle — generational disruption; Tohoku IC 1.2°, 9/11 MC 1.2°]<br>
T26f_saturn_neptune  = +0.06  [MP(♄/♆) ≤5° geodetic angle — dissolution/flooding; Pakistan 2022 DSC 1.6°]<br>
MP formula: MP(A,B) = (A+B)/2 mod 360; indirect = direct+180°. Check both against city angle.<br>
Orb: ≤3° full score; ≤5° partial (×0.5). Mars/NN &amp; Mars/SN: 0 hits at ≤3° — requires wider 5° orb or ACG verification.<br>
<br>
v7.7 ADDITIONS — T27 Cauldron Effect + T28 Pluto-Aquarius Era:<br>
T27_cauldron_dry-wet  = +0.07  [Fire/dry planet (Mars/Sun/Uranus) in wet IC sign (♋/♏/♓) = violent surge, not drought — confirmed: Mars ♋ → Nargis, Helene, Valencia, Myanmar × 4]<br>
T27_cauldron_wet-dry  = +0.07  [Wet planet (Moon/Neptune/Venus) in dry IC sign (♈/♌/♐) = intense dramatic storm, not gentle rain — Neptune ♈ IC = sudden surge archetype]<br>
T27 applies only when planet nature CONTRADICTS IC sign element. Same-nature (wet planet + wet sign) = standard expression, no T27 bonus.<br>
T28_pluto_aquarius    = +0.05  [Pluto ♒ (2024–2043) ≤5° of city geodetic ASC or MC = collective/systemic disruption amplifier — tech failure, AI outage, civil upheaval, power restructuring]<br>
T28 replaces T_pluto_capricorn geological background (epoch closed 2024). Historical: Pluto ♑ ≤5° city angle = geological intensifier (6/6 EQ confirmation, now historical).<br>
Current outer planet era (2025–2028): Neptune ♈ · Pluto ♒ · Uranus ♊. These replace 2012–2024 Pisces/Capricorn background conditions entirely.<br>
<br>
ECLIPSE PAIR score (applied in addition to individual eclipse scores):<br>
pair_p = 1 − (pair_orb_degrees / 10)   [0 at 10°, 1.0 at 0°]<br>
pair_w = 0.25 if geodetic angles crossed | 0.15 if not<br>
pair_score = pair_w × pair_p<br>
<br>
GEODETIC ANGULARITY (Koch — verify in ACG software):<br>
geo_p = max(0, 1 − orb_degrees / 5)<br>
geo_w = 0.22 (≤1°) | 0.14 (≤3°) | 0.08 (≤5°)<br>
geo_score = geo_w × geo_p
      </div>
    </div>
    <div class="card">
      <div class="card-title">Correlation &amp; Effect Size</div>
      <div class="formula">
Phi φ    = (AD − BC) / √[ (A+B)(C+D)(A+C)(B+D) ]<br>
RR       = P(sev≥4 | PSS≥0.45) / P(sev≥4 | PSS&lt;0.45)<br>
Cohen's h = 2·arcsin(√p₁) − 2·arcsin(√p₂)<br>
Star proximity: severity × (1 − 0.5 × dist/orb)   [orb = 2°]<br>
Eclipse decay:  weight × max(0, 1 − days / max_window)
      </div>
    </div>
    <div class="card">
      <div class="card-title">Orb Windows</div>
      <div class="formula">
Station direct/retrograde : ± 7 d (full) → ± 45 d (decay)<br>
Total solar eclipse       : ± 180 d (decay-weighted)<br>
Partial/annular solar     : ± 90 d<br>
Total lunar eclipse       : ± 45 d<br>
Partial lunar eclipse     : ± 21 d<br>
Eclipse pair corridor     : entire window between both eclipses + ±180 d after second<br>
Planet ingress            : ± 5 d<br>
Planetary trigger (Phase 2): ± 5 d from crossing<br>
Fixed star activation     : ± 5 d (planet within 2° of star longitude)<br>
Anaretic degree (28°–29°) : ± 3 d<br>
Geodetic angle orb        : ≤ 5° (verify in ACG software)<br>
Lunation (NM/FM) trigger  : ± 7 d peak · ± 10 d outer limit [T19]<br>
Nodal axis vs angle orb   : ≤ 5° (3° for full score) [T17]<br>
Planetary stress to node  : ≤ 4° conjunction or square [T17]<br>
Eris/Chiron geodetic orb  : ≤ 3° full · ≤ 5° partial [T18]<br>
Midpoint 45° harmonic     : ≤ 2° [T17 extension]
      </div>
    </div>
    <div class="card">
      <div class="card-title">Risk Tier Calibration</div>
      <div class="formula">
⛔ CRITICAL  PSS ≥ 0.70<br>
🔴 HIGH      PSS ≥ 0.55<br>
🟠 MODERATE  PSS ≥ 0.40<br>
🟡 WATCH     PSS ≥ 0.30<br>
🟢 LOW       PSS &lt; 0.30
      </div>
    </div>
    <div class="card">
      <div class="card-title">Why PSS Score ≠ Criteria Count — Reconciliation Guide</div>
      <div class="formula">
PSS is a WEIGHTED SUM. Criteria count is a BINARY COUNT. These measure different things.<br>
<br>
The "✦ n/of" display shows how many techniques triggered (binary), not their combined weight.<br>
"of:15" is a legacy denominator from the v1–v4 model (15 techniques). It was never updated to 22<br>
when T16–T23 were added. A higher count against 15 does not mean higher risk than a lower count<br>
if the lower-count event carries heavier-weight techniques.<br>
<br>
Example — Aug 12 eclipse (8/15 criteria, PSS=0.87) outscores Feb 17 (10/15, PSS=0.79):<br>
  Aug 12: T6 eclipse pair EXACT (+0.25) + T3 total solar eclipse (+0.25+) + T9 Jupiter☍Pluto exact<br>
  These three alone = ~0.55+ before any other technique fires<br>
  Feb 17: 10 criteria triggered but mostly lower-weight secondary techniques (each +0.06–0.10)<br>
  10 × avg 0.08 = ~0.80 max, but not all stack perfectly → actual PSS 0.79<br>
<br>
Weight hierarchy (highest to lowest impact):<br>
  Eclipse pair EXACT crossing geodetic angle  → up to +0.25<br>
  Total solar eclipse at geodetic angle        → +0.25+<br>
  World-point station (0°♈♋♎♑)               → +0.20<br>
  Nodal conjunction to geodetic angle          → +0.15<br>
  Phase 2 Mars trigger                         → +0.15<br>
  Koch geodetic ≤1° orb                        → +0.22<br>
  T25 World Axis (eclipse/malefic ≤3°)         → +0.10 [global-scale amplifier]<br>
  T25 6th/12th or 3rd/9th house axis          → +0.07–0.08 [domain classifier]<br>
  Compare: typical secondary criterion          → +0.06–0.10<br>
<br>
Rule of thumb: ONE eclipse pair EXACT = THREE average secondary criteria in PSS weight.<br>
To reconcile visually: read the PSS bar as ground truth. Use criteria count only to<br>
understand breadth of activation, not depth of risk.
      </div>
    </div>
    <div class="card">
      <div class="card-title">Computed Statistics</div>
      <div id="stats-detail"></div>
    </div>`;
