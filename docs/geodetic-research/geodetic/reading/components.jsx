/* ═══ Shared components for the Geodetic Reading page ═══════════════════
   PlanetaryLinesMap — a stylized relocated-lines plot over Indonesia
   GanttTimeline     — 30/60/90-day transit windows
   PhotoMosaic       — Airbnb-style 2x2 photo hero
   WindowToggle      — 30 / 60 / 90-day pill selector
   BackChrome        — back + share + save row (for "came from atlas" context)
   ════════════════════════════════════════════════════════════════════ */

const { useState, useMemo, useEffect } = React;

/* ─── BackChrome — Airbnb-style top bar ─────────────────────────────── */
function BackChrome({ city, region, theme = 'dark' }) {
  const isLight = theme === 'light';
  const border = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const fg = isLight ? 'var(--color-charcoal)' : 'var(--color-eggshell)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 4px', borderBottom: `1px solid ${border}` }}>
      <button style={{ background: 'none', border: 'none', color: fg, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, padding: 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
        <span>The Atlas</span>
      </button>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: isLight ? 'var(--text-tertiary)' : 'var(--text-tertiary)' }}>
        {city} · {region}
      </div>
      <div style={{ display: 'flex', gap: 18, color: fg, fontFamily: 'var(--font-body)', fontSize: 13 }}>
        <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, textDecoration: 'underline', textUnderlineOffset: 3 }}>Share</button>
        <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, textDecoration: 'underline', textUnderlineOffset: 3 }}>Save</button>
      </div>
    </div>
  );
}

/* ─── PhotoMosaic — Airbnb-style 2x2 hero ───────────────────────────── */
function PhotoMosaic({ photos, radius = 'var(--radius-lg)' }) {
  return (
    <div className="geo-mosaic" style={{ borderRadius: radius, overflow: 'hidden' }}>
      <div className="geo-mosaic-main">
        <img src={photos[0].src} alt={photos[0].alt} />
      </div>
      <div className="geo-mosaic-side">
        <img src={photos[1].src} alt={photos[1].alt} />
        <img src={photos[2].src} alt={photos[2].alt} />
        <img src={photos[3].src} alt={photos[3].alt} />
        <div className="geo-mosaic-count">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1" fill="none"/><path d="M1 8L4 5L6 7L11 2" stroke="currentColor" strokeWidth="1" fill="none"/></svg>
          Show all 24
        </div>
      </div>
    </div>
  );
}

/* ─── WindowToggle — 30 / 60 / 90 day pills ─────────────────────────── */
function WindowToggle({ value, onChange, theme = 'dark' }) {
  const isLight = theme === 'light';
  const bg = isLight ? 'rgba(0,0,0,0.05)' : 'var(--bg-raised)';
  const inactive = isLight ? 'var(--text-tertiary)' : 'var(--text-tertiary)';
  const active = isLight ? 'var(--color-charcoal)' : 'var(--color-eggshell)';
  const activeBg = isLight ? 'var(--color-eggshell)' : 'var(--color-charcoal)';
  return (
    <div style={{ display: 'inline-flex', background: bg, padding: 3, borderRadius: 'var(--radius-full)', gap: 2 }}>
      {[30, 60, 90].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            background: value === n ? activeBg : 'transparent',
            color: value === n ? active : inactive,
            border: 'none',
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontWeight: value === n ? 500 : 400,
            transition: 'all 0.2s var(--ease)',
          }}
        >
          {n} days
        </button>
      ))}
    </div>
  );
}

/* ─── GanttTimeline — transit windows as horizontal bars ────────────── */
function GanttTimeline({ windows, days = 90, theme = 'dark', accent }) {
  const isLight = theme === 'light';
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const labelColor = isLight ? 'var(--text-tertiary)' : 'var(--text-tertiary)';
  const rowBorder = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  const visible = windows.filter(w => w.start < days);
  const today = 0;
  const monthTicks = days === 30 ? [0, 7, 14, 21, 30]
                  : days === 60 ? [0, 15, 30, 45, 60]
                  : [0, 15, 30, 45, 60, 75, 90];

  return (
    <div style={{ width: '100%' }}>
      {/* Header ruler */}
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, marginBottom: 8 }}>
        <div />
        <div style={{ position: 'relative', height: 20, borderBottom: `1px solid ${gridColor}` }}>
          {monthTicks.map(t => (
            <div key={t} style={{ position: 'absolute', left: `${(t / days) * 100}%`, bottom: 0, transform: 'translateX(-50%)' }}>
              <div style={{ height: 6, width: 1, background: gridColor, margin: '0 auto' }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: labelColor, textTransform: 'uppercase', paddingTop: 4, whiteSpace: 'nowrap' }}>
                {t === 0 ? 'now' : `d${t}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {visible.map((w, i) => {
          const startPct = Math.max(0, (w.start / days)) * 100;
          const endPct = Math.min(1, (w.end / days)) * 100;
          const widthPct = endPct - startPct;
          const peakPct = ((w.peak - w.start) / (w.end - w.start)) * 100;
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${rowBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: 20, color: w.color, width: 22, textAlign: 'center' }}>{w.glyph}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: isLight ? 'var(--color-charcoal)' : 'var(--color-eggshell)' }}>{w.planet}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: labelColor, textTransform: 'uppercase' }}>{w.aspect}</div>
                </div>
              </div>
              <div style={{ position: 'relative', height: 28 }}>
                {/* faint grid */}
                {monthTicks.map(t => (
                  <div key={t} style={{ position: 'absolute', left: `${(t / days) * 100}%`, top: 0, bottom: 0, width: 1, background: gridColor }} />
                ))}
                {/* bar */}
                <div style={{
                  position: 'absolute', left: `${startPct}%`, width: `${widthPct}%`, top: 7, height: 14,
                  background: w.color, opacity: 0.22 + w.strength * 0.4,
                  borderRadius: 7,
                }} />
                {/* peak marker */}
                <div style={{
                  position: 'absolute', left: `calc(${startPct}% + ${peakPct}% * ${widthPct / 100})`,
                  top: 2, height: 24, width: 2, background: w.color,
                }} />
                {/* label */}
                <div style={{
                  position: 'absolute', left: `${startPct}%`, top: 24, transform: 'translateY(0)',
                  fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: labelColor, whiteSpace: 'nowrap',
                  paddingLeft: 4,
                }}>
                  — {w.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* today marker */}
    </div>
  );
}

/* ─── PlanetaryLinesMap — stylized map centered on Ubud ─────────────── */
function PlanetaryLinesMap({ lines, theme = 'dark', variant = 'full' }) {
  const isLight = theme === 'light';
  const landColor = isLight ? '#E8E3D3' : '#2a2a2a';
  const seaColor = isLight ? '#F1EFE7' : '#1a1a1a';
  const gridColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
  const textColor = isLight ? 'var(--color-charcoal)' : 'var(--color-eggshell)';

  // Map of ~ Java/Bali/Lombok region, viewBox 400x280
  // Ubud at center (200, 140).
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: variant === 'wide' ? '16/7' : '4/3', background: seaColor, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <svg viewBox="0 0 400 280" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        {/* latitude/longitude grid */}
        {[50, 100, 150, 200].map(y => (
          <line key={'h'+y} x1="0" y1={y} x2="400" y2={y} stroke={gridColor} strokeWidth="0.5" strokeDasharray="2 4" />
        ))}
        {[80, 160, 240, 320].map(x => (
          <line key={'v'+x} x1={x} y1="0" x2={x} y2="280" stroke={gridColor} strokeWidth="0.5" strokeDasharray="2 4" />
        ))}

        {/* Stylized land — Java + Bali + Lombok + Sumbawa */}
        {/* Java (left, large) */}
        <path d="M -20 120 Q 40 108, 80 116 Q 120 122, 160 132 Q 175 138, 180 148 Q 178 158, 155 160 Q 110 162, 70 158 Q 20 152, -20 158 Z" fill={landColor} />
        {/* Bali */}
        <path d="M 186 136 Q 200 132, 212 138 Q 218 144, 214 152 Q 204 156, 192 152 Q 184 146, 186 136 Z" fill={landColor} />
        {/* Lombok */}
        <path d="M 228 138 Q 244 134, 256 142 Q 260 150, 254 156 Q 240 158, 228 152 Q 222 146, 228 138 Z" fill={landColor} />
        {/* Sumbawa */}
        <path d="M 272 140 Q 320 136, 360 144 Q 370 150, 365 158 Q 330 162, 290 158 Q 272 154, 272 140 Z" fill={landColor} />
        {/* little islands south */}
        <circle cx="240" cy="172" r="2" fill={landColor} />
        <circle cx="260" cy="175" r="1.5" fill={landColor} />
        <circle cx="180" cy="108" r="1.5" fill={landColor} />

        {/* Planetary lines — MC/IC lines are vertical, ASC/DSC are curved */}
        {lines.map((l, i) => {
          // Ubud at (200, 148). Distance in km → horizontal offset in viewbox px (~ 1 px ≈ 5 km here)
          const offset = l.dist / 5;
          // MC/IC lines are vertical; ASC/DSC curve. For display simplicity, slight curve on horizon lines.
          if (l.angle === 'MC' || l.angle === 'IC') {
            const x = 200 + (l.angle === 'MC' ? offset : -offset);
            return (
              <g key={i}>
                <line x1={x} y1="0" x2={x} y2="280" stroke={l.color} strokeWidth="1.5" strokeDasharray={l.angle === 'MC' ? '0' : '6 3'} opacity="0.9" />
                <text x={x + 6} y="18" fill={l.color} fontFamily="var(--font-mono)" fontSize="9" letterSpacing="0.1em">{l.planet.toUpperCase()} {l.angle}</text>
                <text x={x + 6} y="30" fill={l.color} fontFamily="var(--font-primary)" fontSize="16">{l.glyph}</text>
              </g>
            );
          } else {
            // horizon lines — broad curve
            const yOffset = l.dist / 5;
            const y = 148 + (l.angle === 'ASC' ? -yOffset : yOffset);
            return (
              <g key={i}>
                <path d={`M 0 ${y + 18} Q 200 ${y - 12} 400 ${y + 22}`} stroke={l.color} strokeWidth="1.5" fill="none" strokeDasharray={l.angle === 'ASC' ? '0' : '6 3'} opacity="0.85" />
                <text x="8" y={y + 14} fill={l.color} fontFamily="var(--font-mono)" fontSize="9" letterSpacing="0.1em">{l.planet.toUpperCase()} {l.angle}</text>
                <text x="40" y={y + 14} fill={l.color} fontFamily="var(--font-primary)" fontSize="16">{l.glyph}</text>
              </g>
            );
          }
        })}

        {/* Ubud pin */}
        <circle cx="200" cy="148" r="9" fill="none" stroke={textColor} strokeWidth="1" opacity="0.4" />
        <circle cx="200" cy="148" r="4" fill={textColor} />
        <text x="208" y="144" fill={textColor} fontFamily="var(--font-mono)" fontSize="9" letterSpacing="0.12em">UBUD</text>
        <text x="208" y="156" fill={textColor} opacity="0.5" fontFamily="var(--font-mono)" fontSize="7" letterSpacing="0.1em">8.50°S 115.26°E</text>

        {/* compass */}
        <g transform="translate(24, 244)" opacity="0.5">
          <circle cx="0" cy="0" r="12" fill="none" stroke={textColor} strokeWidth="0.5" />
          <text x="0" y="-14" fill={textColor} fontFamily="var(--font-mono)" fontSize="7" textAnchor="middle">N</text>
          <line x1="0" y1="-10" x2="0" y2="10" stroke={textColor} strokeWidth="0.5" />
          <line x1="-10" y1="0" x2="10" y2="0" stroke={textColor} strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  );
}

/* ─── DayDots — tiny day-by-day strength strip ──────────────────────── */
function DayDots({ windows, days = 90, theme = 'dark' }) {
  const isLight = theme === 'light';
  // Compute a rough daily score from windows that contain the day
  const scores = [];
  for (let d = 0; d < days; d++) {
    let s = 0;
    for (const w of windows) {
      if (d >= w.start && d <= w.end) {
        const dist = Math.abs(d - w.peak);
        const span = Math.max(1, (w.end - w.start) / 2);
        s += w.strength * Math.max(0, 1 - dist / span);
      }
    }
    scores.push(Math.min(1, s / 1.6));
  }
  const max = Math.max(...scores, 0.01);
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 36, width: '100%' }}>
      {scores.map((s, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${Math.max(8, (s / max) * 100)}%`,
          background: s > 0.6 ? 'var(--color-spiced-life)' : s > 0.35 ? 'var(--gold)' : (isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.22)'),
          borderRadius: 1,
        }} />
      ))}
    </div>
  );
}

Object.assign(window, {
  BackChrome,
  PhotoMosaic,
  WindowToggle,
  GanttTimeline,
  PlanetaryLinesMap,
  DayDots,
});
