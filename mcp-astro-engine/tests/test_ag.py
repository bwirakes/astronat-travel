import swisseph as swe
# The MC longitude is heavily dependent on LONGITUDE of birth place.
# Singapore center is 103.8198E. Wait, 1° of longitude = 4 mins of time difference for MC!
# What if Astro Gold uses a slightly different longitude for Singapore?
jd_birth = swe.julday(1990, 12, 23, 7 + 57/60.0)

ag_venus_mc_jd = swe.julday(2026, 3, 16, 19 + 2/60.0 - 8)
ag_venus_lon = swe.calc_ut(ag_venus_mc_jd, swe.VENUS)[0][0]
ag_mc_lon = (ag_venus_lon - 60) % 360

for d_lon in range(-60, 60):
    try_lon = 103.8198 + (d_lon/60.0)
    _, ascmc = swe.houses(jd_birth, 1.3521, try_lon, b'P')
    if abs(ascmc[1] - ag_mc_lon) < 0.02:
        print(f"Match MC {ag_mc_lon:.4f} at Longitude {try_lon:.4f} (diff {d_lon}' arcminutes)")

# Also, in astrology apps, sometimes they use true geocentric instead of geographic latitude...
# Or Topocentric houses. But MC is same for topocentric except for parallax effects.

# Let's think about the Moon offset. 
# February 18, 9:19 am vs February 18, 8:18 am -> exactly 1h 01m difference.
# Astro Gold Moon transit: Feb 18 3:24 PM. Engine: Feb 18 3:23 PM. -> 1 minute difference.
# Why is Moon-to-Moon matching exactly, but Venus-to-Moon is 1 hour off?
# Venus moves 0.05° per hour. 
# If Moon-to-Moon matches perfectly, Natal Moon must be exactly the same!
# So Astro Gold Natal Moon = Engine Natal Moon (9°32' Pisces).
# So why does Venus take 1 hour LATER to reach 9°32' Pisces in Astro Gold?
# DOES VENUS MOVE SLOWER IN ASTRO GOLD? Or is Astro Gold using Topocentric Venus?

print("\nChecking Topocentric Venus for 1 hour difference...")
# Let's see Topocentric Venus at Astro Gold's 9:19 AM hit time
jd_ag_ven_hit = swe.julday(2026, 2, 18, 9 + 19/60.0 - 8)
swe.set_topo(103.8198, 1.3521, 0)
ven_topo = swe.calc_ut(jd_ag_ven_hit, swe.VENUS | swe.FLG_TOPOCTR)[0][0]
ven_geo = swe.calc_ut(jd_ag_ven_hit, swe.VENUS)[0][0]

print(f"Topocentric Venus at 9:19 AM: {ven_topo:.4f}°")
print(f"Geocentric Venus at 9:19 AM : {ven_geo:.4f}°")
print(f"Natal Moon                   : {swe.calc_ut(jd_birth, swe.MOON)[0][0]:.4f}°")
