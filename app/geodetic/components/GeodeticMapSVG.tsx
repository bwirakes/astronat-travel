export default function GeodeticMapSVG({ className }: { className?: string }) {
  return (
    <svg id="geo-svg" className={className} viewBox="0 0 960 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sepharial geodetic world map with zodiac sign bands">
      <defs>
        <style>{`
          .sign-band{opacity:0;transition:opacity .3s;cursor:pointer;}
          .sign-band:hover{opacity:1;}
          .continent{fill:var(--text-primary);opacity:0.12;stroke:var(--surface-border);strokeWidth:0.5;}
          .geo-line{stroke:var(--surface-border);strokeWidth:0.5;opacity:0.3;}
          .geo-line-0{stroke:var(--color-spiced-life);strokeWidth:1.5;strokeDasharray:4,3;opacity:0.7;}
          .sign-label{fontFamily:'Cormorant Garamond',serif;fontSize:9px;fill:var(--text-secondary);textAnchor:middle;}
          .sign-label-glyph{fontSize:11px;fill:var(--text-primary);opacity:0.7;}
          .city-dot{fill:var(--color-y2k-blue);r:2.5;}
          .city-label{fontFamily:'DM Sans',sans-serif;fontSize:6.5px;fill:var(--color-y2k-blue);opacity:0.75;letterSpacing:0.04em;}
          .band-hover{fill:var(--text-primary);opacity:0.06;stroke:var(--surface-border);strokeWidth:0.5;}
        `}</style>
      </defs>

      {/* Ocean background */}
      <rect width="960" height="480" fill="var(--bg)"/>
      {/* Subtle grid */}
      <line x1="0" y1="240" x2="960" y2="240" stroke="var(--surface-border)" strokeWidth="0.5" strokeDasharray="6,4" opacity="0.1"/>
      <line x1="0" y1="120" x2="960" y2="120" stroke="var(--surface-border)" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.08"/>
      <line x1="0" y1="360" x2="960" y2="360" stroke="var(--surface-border)" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.08"/>

      {/*
        Geodetic system:
        0° Aries  = 0°E   (Greenwich) → x = 480 on a 960-wide map (-180 to +180, so 1°=2.667px)
        Each sign = 30° longitude = 80px on this map
        Signs go: Aries(0-30E), Taurus(30-60E), Gemini(60-90E), Cancer(90-120E), Leo(120-150E), Virgo(150-180E)
                  Pisces(0-30W=330-360E), Aquarius(30-60W), Cap(60-90W), Sag(90-120W), Sco(120-150W), Lib(150-180W)
        x = (lon + 180) * (960/360) = lon*2.667 + 480
      */}

      {/* SIGN BAND FILLS (subtle, show on hover) */}
      {/* Libra: 150W–120W → x: 80–160 */}
      <rect className="sign-band" x="80" y="0" width="80" height="480" fill="rgba(4,86,251,0.2)" rx="0"/>
      {/* Scorpio: 120W–90W → x: 160–240 */}
      <rect className="sign-band" x="160" y="0" width="80" height="480" fill="rgba(100,20,80,0.25)" rx="0"/>
      {/* Sagittarius: 90W–60W → x: 240–320 */}
      <rect className="sign-band" x="240" y="0" width="80" height="480" fill="rgba(230,150,50,0.2)" rx="0"/>
      {/* Capricorn: 60W–30W → x: 320–400 */}
      <rect className="sign-band" x="320" y="0" width="80" height="480" fill="rgba(60,80,60,0.25)" rx="0"/>
      {/* Aquarius: 30W–0 → x: 400–480 */}
      <rect className="sign-band" x="400" y="0" width="80" height="480" fill="rgba(4,86,251,0.2)" rx="0"/>
      {/* Aries: 0–30E → x: 480–560 */}
      <rect className="sign-band" x="480" y="0" width="80" height="480" fill="rgba(230,80,80,0.2)" rx="0"/>
      {/* Taurus: 30E–60E → x: 560–640 */}
      <rect className="sign-band" x="560" y="0" width="80" height="480" fill="rgba(60,120,60,0.22)" rx="0"/>
      {/* Gemini: 60E–90E → x: 640–720 */}
      <rect className="sign-band" x="640" y="0" width="80" height="480" fill="rgba(230,200,80,0.2)" rx="0"/>
      {/* Cancer: 90E–120E → x: 720–800 */}
      <rect className="sign-band" x="720" y="0" width="80" height="480" fill="rgba(50,180,200,0.2)" rx="0"/>
      {/* Leo: 120E–150E → x: 800–880 */}
      <rect className="sign-band" x="800" y="0" width="80" height="480" fill="rgba(230,150,30,0.2)" rx="0"/>
      {/* Virgo: 150E–180E → x: 880–960 */}
      <rect className="sign-band" x="880" y="0" width="80" height="480" fill="rgba(80,140,80,0.2)" rx="0"/>
      {/* Pisces: 180W–150W → x: 0–80 */}
      <rect className="sign-band" x="0" y="0" width="80" height="480" fill="rgba(80,150,200,0.2)" rx="0"/>

      {/* CONTINENT SHAPES (simplified but geographically plausible Mercator) */}
      {/* North America */}
      <path className="continent" d="
        M285,70 L315,65 L345,72 L370,80 L380,95 L375,115 L385,130 L390,150
        L375,165 L360,175 L345,185 L330,210 L315,230 L305,245 L295,255
        L280,248 L268,235 L265,218 L270,200 L275,180 L268,160 L260,142
        L255,125 L260,108 L268,92 L278,80 Z"/>
      {/* Central America / Caribbean */}
      <path className="continent" d="M295,255 L308,258 L315,265 L310,272 L300,268 L292,262 Z"/>
      {/* South America */}
      <path className="continent" d="
        M310,278 L328,272 L345,278 L358,295 L362,318 L358,345
        L350,368 L338,390 L322,405 L308,408 L295,400 L285,380
        L280,358 L282,335 L288,312 L298,292 Z"/>
      {/* Greenland */}
      <path className="continent" d="M390,28 L420,22 L445,28 L450,45 L440,58 L420,62 L400,55 L388,42 Z"/>
      {/* Iceland */}
      <path className="continent" d="M428,72 L442,68 L450,74 L446,82 L432,82 Z"/>

      {/* Europe */}
      <path className="continent" d="
        M468,88 L490,82 L510,80 L528,85 L535,98 L530,112 L520,122
        L510,128 L498,135 L488,142 L480,138 L472,130 L465,118 L462,105 Z"/>
      {/* Scandinavia */}
      <path className="continent" d="
        M490,55 L505,50 L518,55 L525,70 L518,80 L508,82 L495,78 L487,68 Z"/>
      <path className="continent" d="M530,52 L542,48 L548,58 L542,68 L532,65 Z"/>
      {/* British Isles */}
      <path className="continent" d="M456,90 L464,86 L468,94 L462,102 L455,98 Z"/>
      <path className="continent" d="M448,96 L455,92 L458,100 L452,106 L446,102 Z"/>

      {/* Africa */}
      <path className="continent" d="
        M480,145 L500,138 L520,140 L535,152 L542,170 L540,195
        L535,218 L528,240 L520,262 L510,282 L498,298 L486,305
        L472,300 L462,285 L456,265 L452,242 L450,218 L452,195
        L456,172 L464,155 Z"/>
      {/* Madagascar */}
      <path className="continent" d="M552,252 L558,245 L564,258 L560,275 L552,272 Z"/>

      {/* Middle East / Arabian Peninsula */}
      <path className="continent" d="
        M540,130 L562,125 L580,132 L588,148 L582,162 L568,168
        L552,162 L542,150 Z"/>
      {/* Turkey / Anatolia */}
      <path className="continent" d="M520,108 L548,104 L568,108 L572,120 L558,128 L538,128 L522,120 Z"/>

      {/* Central Asia / Russia (simplified) */}
      <path className="continent" d="
        M535,55 L580,45 L640,38 L700,35 L750,38 L790,45 L820,52
        L840,62 L835,80 L815,88 L785,92 L750,88 L715,85 L680,88
        L650,92 L620,95 L592,98 L570,95 L555,88 L542,78 Z"/>
      {/* Siberia extension */}
      <path className="continent" d="M780,38 L820,30 L860,28 L895,35 L905,48 L890,58 L850,62 L815,55 Z"/>

      {/* South Asia / India */}
      <path className="continent" d="
        M618,118 L640,112 L658,115 L668,128 L665,148 L655,168
        L640,182 L625,178 L615,162 L610,145 L612,128 Z"/>
      {/* Sri Lanka */}
      <path className="continent" d="M648,188 L653,185 L658,192 L652,196 Z"/>

      {/* Southeast Asia */}
      <path className="continent" d="
        M680,130 L705,125 L725,130 L728,145 L718,158 L700,162
        L685,155 L678,142 Z"/>
      {/* Indochina */}
      <path className="continent" d="
        M705,148 L722,144 L730,158 L725,175 L712,182 L700,175 L698,160 Z"/>
      {/* Malay Peninsula */}
      <path className="continent" d="M710,180 L718,175 L722,188 L718,202 L710,205 L706,195 Z"/>

      {/* China */}
      <path className="continent" d="
        M665,88 L705,82 L738,86 L758,95 L762,112 L755,128 L738,135
        L718,135 L698,130 L678,125 L665,112 L662,98 Z"/>

      {/* Korean peninsula */}
      <path className="continent" d="M762,95 L775,90 L780,100 L774,112 L762,112 Z"/>
      {/* Japan */}
      <path className="continent" d="M785,92 L798,88 L805,98 L800,110 L788,112 L780,104 Z"/>
      <path className="continent" d="M798,82 L808,78 L812,86 L806,92 L798,86 Z"/>

      {/* Indonesia */}
      <path className="continent" d="M720,210 L748,205 L758,215 L750,225 L722,222 Z"/>
      <path className="continent" d="M760,212 L780,208 L788,218 L778,226 L762,222 Z"/>
      <path className="continent" d="M792,215 L812,210 L818,222 L808,230 L792,225 Z"/>

      {/* Philippines */}
      <path className="continent" d="M748,155 L758,150 L762,160 L756,170 L746,168 Z"/>

      {/* Australia */}
      <path className="continent" d="
        M748,290 L790,280 L825,278 L855,285 L870,302 L868,325
        L855,345 L835,358 L808,362 L780,355 L758,340 L745,320
        L742,302 Z"/>
      {/* New Zealand */}
      <path className="continent" d="M878,340 L886,330 L892,342 L886,358 L878,355 Z"/>
      <path className="continent" d="M882,362 L890,355 L895,365 L890,375 L882,370 Z"/>

      {/* Longitude lines every 30° (= 80px) */}
      {/* x = (lon+180)*960/360 */}
      {/* 180W=0, 150W=80, 120W=160, 90W=240, 60W=320, 30W=400, 0=480, 30E=560, 60E=640, 90E=720, 120E=800, 150E=880, 180E=960 */}
      <line className="geo-line" x1="80"  y1="0" x2="80"  y2="480"/>
      <line className="geo-line" x1="160" y1="0" x2="160" y2="480"/>
      <line className="geo-line" x1="240" y1="0" x2="240" y2="480"/>
      <line className="geo-line" x1="320" y1="0" x2="320" y2="480"/>
      <line className="geo-line" x1="400" y1="0" x2="400" y2="480"/>
      <line className="geo-line-0" x1="480" y1="0" x2="480" y2="480"/>{/* Greenwich / 0° Aries */}
      <line className="geo-line" x1="560" y1="0" x2="560" y2="480"/>
      <line className="geo-line" x1="640" y1="0" x2="640" y2="480"/>
      <line className="geo-line" x1="720" y1="0" x2="720" y2="480"/>
      <line className="geo-line" x1="800" y1="0" x2="800" y2="480"/>
      <line className="geo-line" x1="880" y1="0" x2="880" y2="480"/>

      {/* Equator */}
      <line x1="0" y1="240" x2="960" y2="240" stroke="rgba(202,241,240,0.18)" strokeWidth="0.75" strokeDasharray="6,4"/>

      {/* SIGN GLYPHS & NAMES — centred in each 80px band, at top */}
      {/* Pisces: x=0-80, centre=40 */}
      <text className="sign-label" x="40" y="18"><tspan className="sign-label-glyph">♓</tspan></text>
      <text className="sign-label" x="40" y="30">Pisces</text>
      <text className="sign-label" x="40" y="40" style={{ fontSize: "6.5px", fill: "rgba(248,245,236,0.3)" }}>180°W–150°W</text>
      {/* Aquarius: x=80-160, centre=120 */}
      <text className="sign-label" x="120" y="18"><tspan className="sign-label-glyph">♒</tspan></text>
      <text className="sign-label" x="120" y="30">Aquarius</text>
      <text className="sign-label" x="120" y="40" style={{ fontSize: "6.5px", fill: "rgba(248,245,236,0.3)" }}>150°W–120°W</text>
      {/* Capricorn: 160-240, c=200 */}
      <text className="sign-label" x="200" y="18"><tspan className="sign-label-glyph">♑</tspan></text>
      <text className="sign-label" x="200" y="30">Capricorn</text>
      <text className="sign-label" x="200" y="40" style={{ fontSize: "6.5px", fill: "rgba(248,245,236,0.3)" }}>120°W–90°W</text>
      {/* Sagittarius: 240-320, c=280 */}
      <text className="sign-label" x="280" y="18"><tspan className="sign-label-glyph">♐</tspan></text>
      <text className="sign-label" x="280" y="30">Sagittarius</text>
      <text className="sign-label" x="280" y="40" style={{ fontSize: "6.5px", fill: "rgba(248,245,236,0.3)" }}>90°W–60°W</text>
      {/* Scorpio: 320-400, c=360 */}
      <text className="sign-label" x="360" y="18"><tspan className="sign-label-glyph">♏</tspan></text>
      <text className="sign-label" x="360" y="30">Scorpio</text>
      <text className="sign-label" x="360" y="40" style={{ fontSize: "6.5px", fill: "rgba(248,245,236,0.3)" }}>60°W–30°W</text>
      {/* Libra: 400-480, c=440 */}
      <text className="sign-label" x="440" y="18"><tspan className="sign-label-glyph">♎</tspan></text>
      <text className="sign-label" x="440" y="30">Libra</text>
      <text className="sign-label" x="440" y="40" style={{ fontSize: "6.5px", fill: "rgba(248,245,236,0.3)" }}>30°W–0°</text>
      {/* Aries: 480-560, c=520 */}
      <text className="sign-label" x="520" y="18"><tspan className="sign-label-glyph" style={{ fill: "rgba(230,122,122,0.9)" }}>♈</tspan></text>
      <text className="sign-label" x="520" y="30" style={{ fill: "rgba(230,122,122,0.8)" }}>Aries</text>
      <text className="sign-label" x="520" y="40" style={{ fontSize: "6.5px", fill: "rgba(248,245,236,0.3)" }}>0°–30°E</text>
      {/* Taurus: 560-640, c=600 */}
      <text className="sign-label" x="600" y="18"><tspan className="sign-label-glyph">♉</tspan></text>
      <text className="sign-label" x="600" y="30">Taurus</text>
      <text className="sign-label" x="600" y="40" style={{ fontSize: "6.5px", fill: "rgba(248,245,236,0.3)" }}>30°E–60°E</text>
      {/* Gemini: 640-720, c=680 */}
      <text className="sign-label" x="680" y="18"><tspan className="sign-label-glyph">♊</tspan></text>
      <text className="sign-label" x="680" y="30">Gemini</text>
      <text className="sign-label" x="680" y="40" style={{ fontSize: "6.5px", fill: "rgba(248,245,236,0.3)" }}>60°E–90°E</text>
      {/* Cancer: 720-800, c=760 */}
      <text className="sign-label" x="760" y="18"><tspan className="sign-label-glyph">♋</tspan></text>
      <text className="sign-label" x="760" y="30">Cancer</text>
      <text className="sign-label" x="760" y="40" style={{ fontSize: "6.5px", fill: "rgba(248,245,236,0.3)" }}>90°E–120°E</text>
      {/* Leo: 800-880, c=840 */}
      <text className="sign-label" x="840" y="18"><tspan className="sign-label-glyph">♌</tspan></text>
      <text className="sign-label" x="840" y="30">Leo</text>
      <text className="sign-label" x="840" y="40" style={{ fontSize: "6.5px", fill: "rgba(248,245,236,0.3)" }}>120°E–150°E</text>
      {/* Virgo: 880-960, c=920 */}
      <text className="sign-label" x="920" y="18"><tspan className="sign-label-glyph">♍</tspan></text>
      <text className="sign-label" x="920" y="30">Virgo</text>
      <text className="sign-label" x="920" y="40" style={{ fontSize: "6.5px", fill: "rgba(248,245,236,0.3)" }}>150°E–180°E</text>

      {/* KEY CITY DOTS */}
      {/* London: 0°W → x=480, lat≈51.5N → y≈(90-51.5)*(480/180)=102 */}
      <circle className="city-dot" cx="480" cy="102" r="2.5"/>
      <text className="city-label" x="484" y="100">London</text>
      {/* Paris: 2.3E → x=486 */}
      <circle className="city-dot" cx="486" cy="108" r="2"/>
      <text className="city-label" x="490" y="106">Paris</text>
      {/* Berlin: 13.4E → x=516 */}
      <circle className="city-dot" cx="516" cy="100" r="2"/>
      <text className="city-label" x="520" y="98">Berlin</text>
      {/* Rome: 12.5E → x=513, lat 41.9N → y=114 */}
      <circle className="city-dot" cx="513" cy="114" r="2"/>
      <text className="city-label" x="517" y="112">Rome</text>
      {/* Cairo: 31.2E → x=563, lat 30N → y=160 */}
      <circle className="city-dot" cx="563" cy="160" r="2"/>
      <text className="city-label" x="567" y="158">Cairo</text>
      {/* Istanbul: 28.9E → x=557, lat 41N → y=115 */}
      <circle className="city-dot" cx="557" cy="115" r="2"/>
      <text className="city-label" x="561" y="113">Istanbul</text>
      {/* Nairobi: 36.8E → x=578, lat 1.3S → y=243 */}
      <circle className="city-dot" cx="578" cy="243" r="2"/>
      <text className="city-label" x="582" y="241">Nairobi</text>
      {/* Riyadh: 46.7E → x=605, lat 24.7N → y=174 */}
      <circle className="city-dot" cx="605" cy="174" r="2"/>
      <text className="city-label" x="609" y="172">Riyadh</text>
      {/* Dubai: 55.3E → x=628, lat 25.2N → y=172 */}
      <circle className="city-dot" cx="628" cy="172" r="2"/>
      <text className="city-label" x="632" y="170">Dubai</text>
      {/* Moscow: 37.6E → x=581, lat 55.8N → y=87 */}
      <circle className="city-dot" cx="581" cy="87" r="2"/>
      <text className="city-label" x="585" y="85">Moscow</text>
      {/* Mumbai: 72.8E → x=675, lat 19N → y=195 */}
      <circle className="city-dot" cx="675" cy="195" r="2"/>
      <text className="city-label" x="679" y="193">Mumbai</text>
      {/* Delhi: 77E → x=687, lat 28.6N → y=163 */}
      <circle className="city-dot" cx="687" cy="163" r="2"/>
      <text className="city-label" x="691" y="161">Delhi</text>
      {/* Colombo: 79.9E → x=694, lat 6.9N → y=222 */}
      <circle className="city-dot" cx="694" cy="222" r="2"/>
      <text className="city-label" x="698" y="220">Colombo</text>
      {/* Singapore: 103.8E → x=756, lat 1.3N → y=239 */}
      <circle className="city-dot" cx="756" cy="239" r="2.5" fill="var(--coral)"/>
      <text className="city-label" x="760" y="237" style={{ fill: "rgba(230,122,122,0.85)" }}>Singapore</text>
      {/* Beijing: 116.4E → x=790, lat 39.9N → y=127 */}
      <circle className="city-dot" cx="790" cy="127" r="2"/>
      <text className="city-label" x="794" y="125">Beijing</text>
      {/* Shanghai: 121.5E → x=804, lat 31.2N → y=157 */}
      <circle className="city-dot" cx="804" cy="157" r="2"/>
      <text className="city-label" x="808" y="155">Shanghai</text>
      {/* Tokyo: 139.7E → x=852, lat 35.7N → y=140 */}
      <circle className="city-dot" cx="852" cy="140" r="2.5"/>
      <text className="city-label" x="856" y="138">Tokyo</text>
      {/* Sydney: 151.2E → x=883, lat 33.9S → y=302 */}
      <circle className="city-dot" cx="883" cy="302" r="2"/>
      <text className="city-label" x="887" y="300">Sydney</text>
      {/* New York: 74W → x=283, lat 40.7N → y=120 */}
      <circle className="city-dot" cx="283" cy="120" r="2.5"/>
      <text className="city-label" x="287" y="118">New York</text>
      {/* Washington: 77W → x=275, lat 38.9N → y=125 */}
      <circle className="city-dot" cx="275" cy="125" r="2"/>
      <text className="city-label" x="256" y="123">D.C.</text>
      {/* Los Angeles: 118.2W → x=166, lat 34N → y=147 */}
      <circle className="city-dot" cx="166" cy="147" r="2"/>
      <text className="city-label" x="150" y="145">Los Angeles</text>
      {/* São Paulo: 46.6W → x=356, lat 23.5S → y=263 */}
      <circle className="city-dot" cx="356" cy="263" r="2"/>
      <text className="city-label" x="360" y="261">São Paulo</text>
      {/* Buenos Aires: 58.4W → x=324, lat 34.6S → y=306 */}
      <circle className="city-dot" cx="324" cy="306" r="2"/>
      <text className="city-label" x="328" y="304">Buenos Aires</text>
      {/* Mexico City: 99.1W → x=216, lat 19.4N → y=191 */}
      <circle className="city-dot" cx="216" cy="191" r="2"/>
      <text className="city-label" x="220" y="189">Mexico City</text>
      {/* Toronto: 79.4W → x=269, lat 43.7N → y=112 */}
      <circle className="city-dot" cx="269" cy="112" r="2"/>
      <text className="city-label" x="256" y="110">Toronto</text>
      {/* Johannesburg: 28E → x=555, lat 26.2S → y=270 */}
      <circle className="city-dot" cx="555" cy="270" r="2"/>
      <text className="city-label" x="559" y="268">Johannesburg</text>
      {/* Accra: 0.2W → x=479, lat 5.6N → y=225 */}
      <circle className="city-dot" cx="479" cy="225" r="2"/>
      <text className="city-label" x="460" y="223">Accra</text>
      {/* Lagos: 3.4E → x=489, lat 6.5N → y=223 */}
      <circle className="city-dot" cx="489" cy="223" r="2"/>

      {/* Greenwich label */}
      <text x="482" y="472" fontFamily="'DM Sans',sans-serif" fontSize="7" fill="rgba(230,122,122,0.8)" letterSpacing="0.08em">0° ARIES / GREENWICH</text>

      {/* Equator label */}
      <text x="4" y="236" fontFamily="'DM Sans',sans-serif" fontSize="6" fill="rgba(202,241,240,0.35)" letterSpacing="0.08em">EQUATOR</text>

      {/* Cardinal direction markers */}
      <text x="4" y="14" fontFamily="'DM Sans',sans-serif" fontSize="6.5" fill="rgba(248,245,236,0.2)" letterSpacing="0.06em">180°W</text>
      <text x="474" y="14" fontFamily="'DM Sans',sans-serif" fontSize="6.5" fill="rgba(230,122,122,0.6)" letterSpacing="0.06em">0°</text>
      <text x="944" y="14" fontFamily="'DM Sans',sans-serif" fontSize="6.5" fill="rgba(248,245,236,0.2)" letterSpacing="0.06em">180°E</text>

    </svg>
  );
}