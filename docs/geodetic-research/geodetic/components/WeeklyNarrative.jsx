// Weekly Narrative — the Airbnb "What you'll do" borrow, reskinned as weekly forecast
// Numbered list with thumbnails and AI narrative per week.

function WeeklyNarrative({ weeks, horizon }) {
  // Show weeks that fit in the horizon: 30 -> 4 weeks, 60 -> 8, 90 -> 12
  const weekCount = Math.ceil(horizon / 7);
  const visible = weeks.slice(0, weekCount);

  return (
    <section className="wn">
      <div className="wn-head">
        <span className="kicker kicker--mono" style={{ color: 'var(--gold)' }}>★ What you'll notice · week by week</span>
        <h2 className="wn-title">
          Week by week, the chart<span className="script">&nbsp;unfolds</span>
        </h2>
        <p className="wn-sub">
          A narrative read of each week, keyed to the active transits. Generated from your relocated chart,
          refined against the last 700+ travelers who passed through this longitude.
        </p>
      </div>

      <ol className="wn-list">
        {visible.map(w => (
          <li key={w.n} className="wn-item">
            <div className="wn-thumb">
              <img src={w.thumb} alt=""/>
              <span className="wn-num">W{String(w.n).padStart(2, '0')}</span>
            </div>
            <div className="wn-body">
              <div className="wn-week-label">
                <span>Week {w.n}</span>
                <span className="wn-week-sep">·</span>
                <span>Day {(w.n - 1) * 7 + 1}–{w.n * 7}</span>
              </div>
              <h3 className="wn-week-title">{w.title}</h3>
              <p className="wn-week-note">{w.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

window.WeeklyNarrative = WeeklyNarrative;
