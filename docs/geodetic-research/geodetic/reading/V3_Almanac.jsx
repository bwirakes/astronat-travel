/* ═══ Variation 3: "The Slow Almanac" — Narrative week-by-week scroll ══
   Cinematic full-bleed hero photo, long vertical narrative.
   Weeks and rituals interleave. More contemplative reading experience.
   ═════════════════════════════════════════════════════════════════════ */

function V3Reading() {
  const [days, setDays] = React.useState(90);
  const R = window.READING;

  // Which weeks fit in the selected window
  const visibleWeeks = R.weeks.filter(w => w.w * 7 <= days + 6);

  // Map rituals to week indices for interleaving
  const ritualAtWeek = {};
  R.rituals.forEach((r, i) => {
    // rough: ritual[0] = week 2, [1] = week 4, [2] = week 7, [3] = week 10, [4] = week 12
    const weekMap = [2, 4, 7, 10, 12];
    ritualAtWeek[weekMap[i]] = r;
  });

  return (
    <div className="v3-root">

      {/* ─── CINEMATIC HERO ──────────────────────────── */}
      <section className="v3-hero" style={{ backgroundImage: `url(${R.photos[0].src})` }}>
        <div className="v3-hero-scrim" />
        <div className="v3-hero-chrome">
          <button className="v3-back">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            The Atlas
          </button>
          <div className="v3-hero-chrome-right">
            <button className="v3-chrome-btn">share</button>
            <button className="v3-chrome-btn">save</button>
          </div>
        </div>

        <div className="v3-hero-body">
          <div className="v3-hero-inner">
            <div className="v3-hero-kicker">★ A geodetic reading · 90 days</div>
            <h1 className="v3-title">
              The slow <span className="v3-title-script">almanac</span><br/>
              for Ubud.
            </h1>
            <div className="v3-hero-meta">
              <div>{R.location.city}, {R.location.region}</div>
              <span className="v3-meta-dot">•</span>
              <div>Apr 18 — Jul 17, 2026</div>
              <span className="v3-meta-dot">•</span>
              <div>Generated {R.generated}</div>
            </div>
          </div>
        </div>

        <div className="v3-hero-bottom">
          <div className="v3-hero-thumbs">
            {R.photos.slice(1).map((p, i) => (
              <div key={i} className="v3-hero-thumb" style={{ backgroundImage: `url(${p.src})` }} />
            ))}
          </div>
          <div className="v3-hero-scroll">
            <span>keep reading</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2V12M3 8L7 12L11 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
        </div>
      </section>

      {/* ─── PROLOGUE ──────────────────────────────── */}
      <section className="v3-prologue">
        <div className="v3-container">
          <div className="v3-prologue-grid">
            <div className="v3-prologue-kick">
              <div className="v3-kicker">Prologue</div>
              <div className="v3-resonance">
                <div className="v3-resonance-num">{R.resonance}</div>
                <div className="v3-resonance-label">Resonance<br/>this window</div>
              </div>
            </div>
            <div className="v3-prologue-body">
              <p className="v3-lede">{R.hook}</p>
              <div className="v3-drop-line">
                <span className="v3-drop-line-inner">
                  Venus on your IC. Jupiter on the Descendant. Neptune sextile the MC. The skeleton key, so to speak, is a <em>softening</em>.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PART I: THE LINES ─────────────────────── */}
      <section className="v3-part v3-part-lines">
        <div className="v3-container">
          <div className="v3-part-head">
            <div className="v3-kicker">Part I</div>
            <h2 className="v3-h2">The lines that reach this island.</h2>
            <p className="v3-part-intro">
              Four major planetary lines pass within 300km of Ubud. Geodetic astrology reads these like latitude lines of mood. An angle — IC, MC, ASC, DSC — means the planet doesn't just visit. It <em>lives</em> there.
            </p>
          </div>
          <div className="v3-map-block">
            <PlanetaryLinesMap lines={R.lines} theme="dark" variant="wide" />
          </div>
          <div className="v3-lines-list">
            {R.lines.map((l, i) => (
              <article key={i} className="v3-line">
                <div className="v3-line-col-left">
                  <span className="v3-line-glyph" style={{ color: l.color }}>{l.glyph}</span>
                  <div className="v3-line-kicker">line {String(i+1).padStart(2,'0')} / {R.lines.length}</div>
                </div>
                <div className="v3-line-col-main">
                  <h3 className="v3-line-h">
                    {l.planet} <span className="v3-line-h-angle">on the {l.angle}</span>
                  </h3>
                  <p className="v3-line-note">{l.note}</p>
                </div>
                <div className="v3-line-col-right">
                  <div className="v3-line-dist">{l.dist === 0 ? 'exact' : `${l.dist} km`}</div>
                  <div className="v3-line-dist-label">from center</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PART II: THE WINDOWS (Gantt) ──────────── */}
      <section className="v3-part v3-part-timeline">
        <div className="v3-container">
          <div className="v3-part-head v3-part-head-row">
            <div>
              <div className="v3-kicker">Part II</div>
              <h2 className="v3-h2">When, and how hard.</h2>
              <p className="v3-part-intro">Each bar is a window; each tick is its peak. Peaks are when you'll feel it most — bars are the soft approach and slow departure.</p>
            </div>
            <WindowToggle value={days} onChange={setDays} theme="dark" />
          </div>
          <div className="v3-gantt-wrap">
            <GanttTimeline windows={R.windows} days={days} theme="dark" />
          </div>
          <div className="v3-day-strip-wrap">
            <div className="v3-day-strip-label">Daily intensity strip · {days} days</div>
            <DayDots windows={R.windows} days={days} theme="dark" />
          </div>
        </div>
      </section>

      {/* ─── PART III: MOVEMENTS (steps) ───────────── */}
      <section className="v3-part v3-part-movements">
        <div className="v3-container">
          <div className="v3-part-head">
            <div className="v3-kicker">Part III</div>
            <h2 className="v3-h2">Four movements, loosely in order.</h2>
          </div>
          <ol className="v3-movements">
            {R.steps.map(s => (
              <li key={s.n} className="v3-movement">
                <div className="v3-movement-n">Mvt. {String(s.n).padStart(2,'0')}</div>
                <div className="v3-movement-img" style={{ backgroundImage: `url(${s.img})` }} />
                <div className="v3-movement-body">
                  <div className="v3-movement-window">{s.window}</div>
                  <h3 className="v3-movement-title">{s.title}</h3>
                  <p className="v3-movement-text">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── PART IV: WEEK BY WEEK (with rituals interleaved) ── */}
      <section className="v3-part v3-part-weeks">
        <div className="v3-container">
          <div className="v3-part-head">
            <div className="v3-kicker">Part IV</div>
            <h2 className="v3-h2">Week by week.</h2>
            <p className="v3-part-intro">Thirteen short entries. Ritual prompts surface where they're most useful.</p>
          </div>
          <div className="v3-weeks">
            {visibleWeeks.map(w => {
              const ritual = ritualAtWeek[w.w];
              return (
                <React.Fragment key={w.w}>
                  <article className="v3-week">
                    <div className="v3-week-spine">
                      <div className="v3-week-n">Week {String(w.w).padStart(2,'0')}</div>
                      <div className="v3-week-range">{w.range}</div>
                      <div className="v3-week-line" />
                    </div>
                    <div className="v3-week-body">
                      <h4 className="v3-week-title">{w.title}</h4>
                      <p className="v3-week-text">{w.body}</p>
                    </div>
                  </article>
                  {ritual && (
                    <aside className="v3-ritual-insert">
                      <div className="v3-ritual-insert-spine">
                        <span className="v3-ritual-insert-glyph">{ritual.glyph}</span>
                        <div className="v3-ritual-insert-label">Ritual · {ritual.when}</div>
                      </div>
                      <div className="v3-ritual-insert-body">
                        <h5 className="v3-ritual-insert-title">{ritual.title}</h5>
                        <p className="v3-ritual-insert-text">{ritual.body}</p>
                      </div>
                    </aside>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── COLOPHON ──────────────────────────────── */}
      <footer className="v3-colophon">
        <div className="v3-container">
          <div className="v3-colophon-grid">
            <div>
              <div className="v3-kicker">Colophon</div>
              <p className="v3-colophon-text">
                Calculated for {R.location.city}, {R.location.region} · {R.location.lat.toFixed(4)}°S {R.location.lon.toFixed(4)}°E. Ephemeris DE440. Generated {R.generated}. Set again when you come home.
              </p>
            </div>
            <div className="v3-colophon-script">
              <span className="v3-script">read again in september</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

window.V3Reading = V3Reading;
