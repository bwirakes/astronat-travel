/* ═══ Variation 1: "The Ubud Opening" — Editorial Magazine ═════════════
   VIEWPORT-FIRST hero: top fold = title + 3 best travel windows.
   Lede, photos and interpretations live below.
   ═════════════════════════════════════════════════════════════════════ */

function V1Reading() {
  const [days, setDays] = React.useState(90);
  const R = window.READING;

  const horizonEnd = days === 30 ? 'May 17' : days === 60 ? 'Jun 17' : 'Jul 17';
  const visibleWindows = R.travelWindows.slice(0, days === 30 ? 1 : days === 60 ? 2 : 3);

  return (
    <div className="v1-root" data-theme="light">
      <div className="v1-container">

        <BackChrome city={R.location.city} region={R.location.region} theme="light" />

        {/* ─── HERO — WINDOWS ABOVE THE FOLD ────────────────── */}
        <section className="v1-hero">
          <div className="v1-hero-head">
            <div className="v1-hero-head-left">
              <div className="kicker v1-kicker">★ Traveler's brief · Generated {R.generated}</div>
              <h1 className="v1-title">
                The Ubud <span className="script v1-script">opening</span>
              </h1>
              <div className="v1-meta">
                <span>{R.location.city}, {R.location.region}</span>
                <span className="v1-dot">·</span>
                <span>{R.location.lat.toFixed(2)}°S {R.location.lon.toFixed(2)}°E</span>
                <span className="v1-dot">·</span>
                <span>{visibleWindows.length} {visibleWindows.length === 1 ? 'window' : 'windows'} · next {days} days</span>
              </div>
            </div>
            <div className="v1-hero-toggle">
              <span className="v1-toggle-hint">Horizon</span>
              <WindowToggle value={days} onChange={setDays} theme="light" />
            </div>
          </div>

          {/* THREE WINDOWS — primary content of the fold */}
          <div className="v1-windows">
            <div className="v1-windows-head">
              <div className="kicker v1-kicker">Best travel windows</div>
              <span className="v1-windows-horizon">Apr 18 — {horizonEnd}, 2026</span>
            </div>
            <div className="v1-windows-grid">
              {visibleWindows.map((w, i) => (
                <article key={w.n} className={`v1-window ${i === 0 ? 'v1-window-hero' : ''}`}>
                  <div className="v1-window-top">
                    <div className="v1-window-rank" style={{ color: w.color }}>
                      <span className="v1-window-dot" style={{ background: w.color }} />
                      {w.rank}
                    </div>
                    <div className="v1-window-score">{w.score}</div>
                  </div>
                  <div className="v1-window-dates">{w.dates}</div>
                  <div className="v1-window-meta">{w.days}</div>
                  <div className="v1-window-bar">
                    <div className="v1-window-bar-fill" style={{ width: `${w.score}%`, background: w.color }} />
                  </div>
                  <p className="v1-window-note">{w.note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── LEDE + PHOTOS — below-the-fold context ─────────── */}
        <section className="v1-context">
          <div className="v1-context-grid">
            <div className="v1-context-lede">
              <div className="kicker v1-kicker">Why this place, this season</div>
              <p className="v1-lede">{R.hook}</p>
            </div>
            <div className="v1-context-stats">
              <div className="v1-summary-metric">
                <div className="v1-summary-num">{R.resonance}</div>
                <div className="v1-summary-ml">resonance<br/>best window</div>
              </div>
              <div className="v1-summary-metric">
                <div className="v1-summary-num">{R.lines.length}</div>
                <div className="v1-summary-ml">planetary lines<br/>within 300km</div>
              </div>
            </div>
          </div>
          <PhotoMosaic photos={R.photos} />
        </section>

        {/* ─── INTERPRETATIONS — everything below ─────────────── */}
        <div className="v1-interp-intro">
          <div className="kicker v1-kicker">Interpretations</div>
          <p className="v1-interp-intro-text">The reasoning behind the windows above — why they opened, what the sky is doing, and what a visit tends to feel like. Read in order or skim.</p>
        </div>

        {/* ─── PLANETARY LINES ───────────────────────────────── */}
        <section className="v1-section">
          <div className="v1-section-head">
            <div>
              <div className="kicker v1-kicker">§ 1 — The geodetic reading</div>
              <h2 className="v1-h2">Why this island, for this chart.</h2>
            </div>
            <p className="v1-section-desc">
              Four major planetary lines pass within 300km of Ubud. A line on an angle is a line you <em>feel</em> — Venus on your IC means home, quite literally, rewires you while you're here.
            </p>
          </div>
          <div className="v1-map-wrap">
            <PlanetaryLinesMap lines={R.lines} theme="light" />
            <div className="v1-lines-table">
              {R.lines.map((l, i) => (
                <div key={i} className="v1-line-row">
                  <span className="v1-line-glyph" style={{ color: l.color }}>{l.glyph}</span>
                  <div>
                    <div className="v1-line-title">
                      {l.planet} <span className="v1-line-angle">on the {l.angle}</span>
                    </div>
                    <div className="v1-line-note">{l.note}</div>
                  </div>
                  <div className="v1-line-dist">{l.dist === 0 ? 'exact' : `${l.dist}km`}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TRANSIT TIMELINE (Gantt) ──────────────────────── */}
        <section className="v1-section">
          <div className="v1-section-head">
            <div>
              <div className="kicker v1-kicker">§ 2 — The windows, in detail</div>
              <h2 className="v1-h2">When the sky opens, and when it closes.</h2>
            </div>
            <div className="v1-toggle-row">
              <span className="v1-toggle-hint">Horizon</span>
              <WindowToggle value={days} onChange={setDays} theme="light" />
            </div>
          </div>
          <div className="v1-gantt-wrap">
            <GanttTimeline windows={R.windows} days={days} theme="light" />
          </div>
          <div className="v1-gantt-legend">
            <span><span className="v1-legend-dot v1-legend-peak" /> Vertical tick = peak exact</span>
            <span><span className="v1-legend-dot v1-legend-bar" /> Bar length = influence window</span>
            <span><span className="v1-legend-dot v1-legend-strong" /> Opacity = strength</span>
          </div>
        </section>

        {/* ─── MOVEMENTS ─────────────────────────────────────── */}
        <section className="v1-section">
          <div className="v1-section-head">
            <div>
              <div className="kicker v1-kicker">§ 3 — What a visit tends to feel like</div>
              <h2 className="v1-h2">Four movements, loosely in order.</h2>
            </div>
            <p className="v1-section-desc">
              Forecasts aren't fortune — they're weather. Here is what kind of weather this sky tends to make when you're in it, in the order we expect it.
            </p>
          </div>
          <ol className="v1-steps">
            {R.steps.map(s => (
              <li key={s.n} className="v1-step">
                <div className="v1-step-n">{String(s.n).padStart(2, '0')}</div>
                <div className="v1-step-body">
                  <div className="v1-step-window">{s.window} of a visit</div>
                  <h3 className="v1-step-title">{s.title}</h3>
                  <p className="v1-step-text">{s.body}</p>
                </div>
                <div className="v1-step-img" style={{ backgroundImage: `url(${s.img})` }} />
              </li>
            ))}
          </ol>
        </section>

        {/* ─── WEEK-BY-WEEK ──────────────────────────────────── */}
        <section className="v1-section">
          <div className="v1-section-head">
            <div>
              <div className="kicker v1-kicker">§ 4 — The weekly sky</div>
              <h2 className="v1-h2">Thirteen weeks, one page.</h2>
            </div>
            <p className="v1-section-desc">
              What the sky over Ubud is doing, week by week. Use this to time a visit — or to read it after.
            </p>
          </div>
          <div className="v1-weeks">
            {R.weeks.map(w => (
              <article key={w.w} className="v1-week">
                <div className="v1-week-n">Week {String(w.w).padStart(2, '0')}</div>
                <div className="v1-week-range">{w.range}</div>
                <h4 className="v1-week-title">{w.title}</h4>
                <p className="v1-week-body">{w.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── RITUAL CARDS ──────────────────────────────────── */}
        <section className="v1-section">
          <div className="v1-section-head">
            <div>
              <div className="kicker v1-kicker">§ 5 — If you go, these small things help</div>
              <h2 className="v1-h2">Five small practices, window-tuned.</h2>
            </div>
            <p className="v1-section-desc">
              None of these require anything. Each is written to fit in ten minutes or less, while you're there.
            </p>
          </div>
          <div className="v1-rituals">
            {R.rituals.map((r, i) => (
              <div key={i} className="v1-ritual">
                <div className="v1-ritual-head">
                  <span className="v1-ritual-glyph">{r.glyph}</span>
                  <span className="v1-ritual-when">{r.when} of visit</span>
                </div>
                <h4 className="v1-ritual-title">{r.title}</h4>
                <p className="v1-ritual-body">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="v1-footer">
          <div className="v1-footer-left">
            <div className="kicker v1-kicker">End of reading</div>
            <div className="v1-footer-line">
              Calculated for {R.location.city} · {R.location.lat.toFixed(4)}°S {R.location.lon.toFixed(4)}°E · {R.location.tz}. Generated {R.generated}.
            </div>
          </div>
          <div className="v1-footer-right">
            <span className="script v1-script-sm">read again in September</span>
          </div>
        </footer>

      </div>
    </div>
  );
}

window.V1Reading = V1Reading;
