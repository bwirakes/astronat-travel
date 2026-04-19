// Planetary Lines Map — stylized abstract "map" of Bali with ACG lines crossing
// Not a geographic map — a visual shorthand. Island silhouette + lines crossing.

function LinesMap({ lines, location }) {
  // SVG viewBox 600x400. Island silhouette is an abstract organic blob.
  // Lines are drawn at various angles crossing near the island.
  return (
    <section className="lm">
      <div className="lm-head">
        <span className="kicker kicker--mono" style={{ color: 'var(--gold)' }}>★ Planetary lines · ±500 km</span>
        <h2 className="lm-title">
          Where the sky<span className="script">&nbsp;crosses&nbsp;</span>ground
        </h2>
      </div>

      <div className="lm-frame">
        <svg className="lm-svg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">
          {/* Ocean grid */}
          <defs>
            <pattern id="lmGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0H0V30" fill="none" stroke="currentColor" strokeOpacity="0.06" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="600" height="400" fill="url(#lmGrid)" style={{ color: 'var(--color-eggshell)' }}/>

          {/* Equator-ish latitude line */}
          <line x1="0" y1="200" x2="600" y2="200" stroke="var(--color-eggshell)" strokeOpacity="0.12" strokeDasharray="2 6"/>

          {/* Bali-shape blob (abstract) */}
          <path
            d="M 240 210 Q 270 195 310 200 Q 355 205 380 218 Q 400 232 388 248 Q 370 262 340 264 Q 300 265 275 258 Q 245 250 232 234 Q 222 220 240 210 Z"
            fill="var(--bg-raised)"
            stroke="var(--color-eggshell)"
            strokeOpacity="0.3"
            strokeWidth="1"
          />

          {/* Planetary lines — each at different angle and offset */}
          {lines.map((ln, i) => {
            // Generate a diagonal line based on index
            const angles = [72, 110, 95, 65]; // degrees
            const offsets = [-40, +80, -90, +120]; // pixel offset from center x
            const angle = angles[i % angles.length] * Math.PI / 180;
            const offset = offsets[i % offsets.length];
            const cx = 310 + offset;
            const cy = 232;
            const L = 500;
            const dx = Math.cos(angle) * L;
            const dy = Math.sin(angle) * L;
            return (
              <g key={ln.planet + i}>
                <line
                  x1={cx - dx} y1={cy - dy} x2={cx + dx} y2={cy + dy}
                  stroke={ln.tone} strokeWidth="1.5" strokeOpacity="0.85"
                />
                {/* Crossing point marker */}
                <circle cx={cx} cy={cy} r="4" fill={ln.tone}/>
                <circle cx={cx} cy={cy} r="10" fill="none" stroke={ln.tone} strokeOpacity="0.4"/>
                {/* Label at top of line */}
                <g transform={`translate(${cx - dx * 0.75}, ${cy - dy * 0.75})`}>
                  <text fill={ln.tone} fontSize="14" fontFamily="var(--font-primary)" textAnchor="middle">{ln.planet}</text>
                  <text fill={ln.tone} fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" y="14" letterSpacing="1.2">{ln.line}</text>
                </g>
              </g>
            );
          })}

          {/* Location pin */}
          <g>
            <circle cx="310" cy="232" r="3" fill="var(--color-eggshell)"/>
            <circle cx="310" cy="232" r="14" fill="none" stroke="var(--color-eggshell)" strokeOpacity="0.6" strokeDasharray="2 3"/>
            <text x="310" y="280" fill="var(--color-eggshell)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="1.5">
              {location.name.toUpperCase()}
            </text>
            <text x="310" y="292" fill="var(--text-tertiary)" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="1">
              {location.lat} / {location.lng}
            </text>
          </g>

          {/* Compass */}
          <g transform="translate(540, 50)" style={{ fontFamily: 'var(--font-mono)' }}>
            <circle r="22" fill="none" stroke="var(--color-eggshell)" strokeOpacity="0.3"/>
            <text y="-26" fontSize="9" fill="var(--gold)" textAnchor="middle" letterSpacing="1.2">N</text>
            <line x1="0" y1="-18" x2="0" y2="-2" stroke="var(--gold)" strokeWidth="1.2"/>
          </g>
        </svg>

        {/* Legend */}
        <ul className="lm-legend">
          {lines.map(ln => (
            <li key={ln.planet}>
              <span className="lm-legend-glyph" style={{ color: ln.tone }}>{ln.planet}</span>
              <div>
                <div className="lm-legend-name">{ln.planetName} <span className="lm-legend-line">{ln.line}</span></div>
                <div className="lm-legend-meta">{ln.offset_km} km {ln.dir} of location</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

window.LinesMap = LinesMap;
