/* ═══ Variation 2: "Atlas Almanac" — Dense data-forward editorial ═══════
   Dark charcoal background, mono grid, planetary-lines map hero,
   Gantt as primary. Terminal-meets-magazine feel.
   ═════════════════════════════════════════════════════════════════════ */

function V2Reading() {
  const [days, setDays] = React.useState(90);
  const R = window.READING;

  // Split weeks into 30/60/90 day visible chunks
  const visibleWeeks = R.weeks.filter(w => w.w * 7 <= days + 6);

  return (
    <div className="v2-root">
      <div className="v2-container">

        {/* ─── TOP BAR ───────────────────────────────── */}
        <header className="v2-topbar">
          <div className="v2-topbar-left">
            <button className="v2-back">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Atlas
            </button>
            <span className="v2-breadcrumb">/ reading / ubud-01</span>
          </div>
          <div className="v2-topbar-center">
            <span className="v2-runid">RUN.2026-04-18T09:12:04Z</span>
            <span className="v2-sep">·</span>
            <span>847 calcs</span>
            <span className="v2-sep">·</span>
            <span>ephem DE440</span>
          </div>
          <div className="v2-topbar-right">
            <button className="v2-link">share</button>
            <button className="v2-link">save</button>
            <button className="v2-link">export</button>
          </div>
        </header>

        {/* ─── HERO ── split: title + quiet photo mosaic + score stack ── */}
        <section className="v2-hero">
          <div className="v2-hero-head">
            <div>
              <div className="v2-kicker">★ Geodetic reading · The Ubud file</div>
              <h1 className="v2-title">
                A quiet<br/>opening over<br/><span className="v2-title-script">bali.</span>
              </h1>
              <div className="v2-hero-meta">
                <div><span className="v2-meta-k">location</span><span className="v2-meta-v">{R.location.city}, {R.location.region}</span></div>
                <div><span className="v2-meta-k">coords</span><span className="v2-meta-v">{R.location.lat.toFixed(4)}°S · {R.location.lon.toFixed(4)}°E</span></div>
                <div><span className="v2-meta-k">window</span><span className="v2-meta-v">Apr 18 — Jul 17, 2026</span></div>
                <div><span className="v2-meta-k">tz</span><span className="v2-meta-v">{R.location.tz} · {R.location.localTime} now</span></div>
              </div>
            </div>
            <div className="v2-score-stack">
              <div className="v2-score-num">{R.resonance}</div>
              <div className="v2-score-label">Resonance<br/>this window</div>
              <div className="v2-score-breakdown">
                <div><span>angular hits</span><strong>2</strong></div>
                <div><span>major windows</span><strong>7</strong></div>
                <div><span>peak days</span><strong>14</strong></div>
              </div>
            </div>
          </div>

          <div className="v2-hero-photos">
            {R.photos.map((p, i) => (
              <div key={i} className="v2-hero-photo" style={{ backgroundImage: `url(${p.src})` }}>
                <span className="v2-hero-photo-idx">0{i+1} / 04</span>
              </div>
            ))}
          </div>

          <div className="v2-hook-row">
            <div className="v2-hook-bar" />
            <p className="v2-hook">{R.hook}</p>
          </div>
        </section>

        {/* ─── PLANETARY LINES MAP — the centerpiece ───────────── */}
        <section className="v2-block">
          <div className="v2-block-head">
            <div className="v2-block-tag">01 · Planetary lines</div>
            <h2 className="v2-h2">Four lines within 300km.</h2>
            <p className="v2-block-desc">Astro*carto*graphy plotted against the Sunda chain. Lines drawn exact; angular orbs ≤ 2°.</p>
          </div>
          <div className="v2-map-grid">
            <div className="v2-map-canvas">
              <PlanetaryLinesMap lines={R.lines} theme="dark" />
              <div className="v2-map-legend">
                {R.lines.map((l, i) => (
                  <span key={i} className="v2-map-legend-item">
                    <span className="v2-line-swatch" style={{ background: l.color }} />
                    {l.planet} {l.angle}
                  </span>
                ))}
              </div>
            </div>
            <div className="v2-lines-ol">
              {R.lines.map((l, i) => (
                <div key={i} className="v2-line-block">
                  <div className="v2-line-head">
                    <span className="v2-line-glyph" style={{ color: l.color }}>{l.glyph}</span>
                    <div className="v2-line-title">
                      <div className="v2-line-name">{l.planet} <span className="v2-line-ang">· {l.angle}</span></div>
                      <div className="v2-line-dist">{l.dist === 0 ? 'orb 0° · exact' : `orb ~${(l.dist / 111).toFixed(1)}° · ${l.dist}km`}</div>
                    </div>
                  </div>
                  <div className="v2-line-note">{l.note}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── GANTT TIMELINE — main event ───────────────────── */}
        <section className="v2-block">
          <div className="v2-block-head v2-block-head-row">
            <div>
              <div className="v2-block-tag">02 · Transit windows</div>
              <h2 className="v2-h2">When, and how hard.</h2>
            </div>
            <WindowToggle value={days} onChange={setDays} theme="dark" />
          </div>

          <div className="v2-day-strip">
            <div className="v2-day-strip-label">Daily intensity</div>
            <DayDots windows={R.windows} days={days} theme="dark" />
          </div>

          <div className="v2-gantt">
            <GanttTimeline windows={R.windows} days={days} theme="dark" />
          </div>
        </section>

        {/* ─── WHAT YOU'LL EXPERIENCE — 4 numbered cards ────── */}
        <section className="v2-block">
          <div className="v2-block-head">
            <div className="v2-block-tag">03 · What you'll experience</div>
            <h2 className="v2-h2">Four movements, loosely in order.</h2>
            <p className="v2-block-desc">Forecasts aren't fortune — they're weather. Here is what this sky tends to make, and when.</p>
          </div>
          <ol className="v2-steps">
            {R.steps.map(s => (
              <li key={s.n} className="v2-step">
                <div className="v2-step-img" style={{ backgroundImage: `url(${s.img})` }}>
                  <div className="v2-step-n">{String(s.n).padStart(2, '0')}</div>
                </div>
                <div className="v2-step-body">
                  <div className="v2-step-window">{s.window}</div>
                  <h3 className="v2-step-title">{s.title}</h3>
                  <p className="v2-step-text">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ─── WEEKS — mono table ──────────────────────────── */}
        <section className="v2-block">
          <div className="v2-block-head v2-block-head-row">
            <div>
              <div className="v2-block-tag">04 · Weekly log</div>
              <h2 className="v2-h2">Thirteen entries.</h2>
            </div>
            <div className="v2-weeks-count">{visibleWeeks.length} of 13 weeks</div>
          </div>
          <div className="v2-weeks-table">
            <div className="v2-weeks-thead">
              <div>Wk</div><div>Date range</div><div>Title</div><div>Note</div>
            </div>
            {visibleWeeks.map(w => (
              <div key={w.w} className="v2-weeks-row">
                <div className="v2-weeks-n">W{String(w.w).padStart(2,'0')}</div>
                <div className="v2-weeks-range">{w.range}</div>
                <div className="v2-weeks-title">{w.title}</div>
                <div className="v2-weeks-body">{w.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── RITUALS — as cards with left accent ───────── */}
        <section className="v2-block">
          <div className="v2-block-head">
            <div className="v2-block-tag">05 · Ritual prompts</div>
            <h2 className="v2-h2">Five small practices.</h2>
          </div>
          <div className="v2-rituals">
            {R.rituals.map((r, i) => (
              <div key={i} className="v2-ritual">
                <div className="v2-ritual-num">R.{String(i+1).padStart(2,'0')}</div>
                <div className="v2-ritual-when">{r.when}</div>
                <h4 className="v2-ritual-title">
                  <span className="v2-ritual-glyph">{r.glyph}</span>{r.title}
                </h4>
                <p className="v2-ritual-body">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FOOTER ─────────────────────────────────────── */}
        <footer className="v2-footer">
          <div>
            <div className="v2-kicker">End of file</div>
            <div className="v2-footer-line">Astronat · ephem DE440 · swiss eph 2.10 · {R.generated}</div>
          </div>
          <div className="v2-footer-script">
            <span className="script v2-script">read again in september</span>
          </div>
        </footer>

      </div>
    </div>
  );
}

window.V2Reading = V2Reading;
