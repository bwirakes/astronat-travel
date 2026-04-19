// Transit Timeline — Gantt-style horizontal bars per planet transit window
// Bars are positioned by start/end day over the active forecast horizon (30/60/90).

function TransitTimeline({ windows, horizon, onSelect, selected }) {
  // Filter windows that overlap the active horizon, but always show them
  // clipped — a window that ends past horizon is truncated visually but labeled "→"
  const visible = windows.filter(w => w.start < horizon);

  // Day marks every 7 days
  const dayMarks = [];
  for (let d = 0; d <= horizon; d += 7) dayMarks.push(d);

  const today = new Date();
  const fmtDay = (d) => {
    const dt = new Date(today.getTime() + d * 86400000);
    return `${dt.toLocaleString('en', { month: 'short' })} ${dt.getDate()}`;
  };

  return (
    <section className="tt">
      <div className="tt-head">
        <div>
          <span className="kicker kicker--mono" style={{ color: 'var(--gold)' }}>★ Transit windows · next {horizon} days</span>
          <h2 className="tt-title">
            When it<span className="script">&nbsp;lands,&nbsp;</span>where
          </h2>
        </div>
        <div className="tt-legend">
          <span className="tt-legend-dot" style={{ background: 'var(--color-y2k-blue)' }}/>
          <span>Peak</span>
          <span className="tt-legend-bar"/>
          <span>Window</span>
        </div>
      </div>

      {/* Axis */}
      <div className="tt-grid">
        <div className="tt-axis">
          {dayMarks.map(d => (
            <div key={d} className="tt-axis-mark" style={{ left: `${(d / horizon) * 100}%` }}>
              <span className="tt-axis-num">{d === 0 ? 'TODAY' : `+${d}d`}</span>
              <span className="tt-axis-date">{fmtDay(d)}</span>
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="tt-rows">
          {visible.map(w => {
            const leftPct = Math.max(0, (w.start / horizon) * 100);
            const rightPct = Math.min(100, (w.end / horizon) * 100);
            const widthPct = rightPct - leftPct;
            const peakPct = ((w.peak - w.start) / (w.end - w.start)) * 100;
            const clipped = w.end > horizon;
            const isSel = selected === w.id;
            return (
              <div key={w.id} className={`tt-row ${isSel ? 'tt-row--sel' : ''}`} onClick={() => onSelect(w.id)}>
                <div className="tt-row-label">
                  <span className="tt-row-glyph" style={{ color: w.tone }}>{w.planet}</span>
                  <span className="tt-row-planet">{w.planetName}</span>
                  <span className="tt-row-line">{w.line}</span>
                </div>
                <div className="tt-row-track">
                  <div
                    className="tt-bar"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      background: `linear-gradient(90deg, transparent 0%, ${w.tone} 18%, ${w.tone} 82%, ${clipped ? w.tone : 'transparent'} 100%)`,
                      opacity: isSel ? 1 : 0.6,
                    }}
                  >
                    <div className="tt-bar-peak" style={{ left: `${peakPct}%`, background: w.tone }}/>
                    <span className="tt-bar-label">{w.title}</span>
                    {clipped && <span className="tt-bar-clip">→</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Today line */}
        <div className="tt-today"/>
      </div>

      {/* Selected window detail */}
      {(() => {
        const w = visible.find(x => x.id === selected) || visible[0];
        if (!w) return null;
        return (
          <div className="tt-detail" style={{ borderLeft: `3px solid ${w.tone}` }}>
            <div className="tt-detail-head">
              <span className="tt-detail-glyph" style={{ color: w.tone }}>{w.planet}</span>
              <div>
                <div className="tt-detail-title">{w.title}</div>
                <div className="tt-detail-sub">
                  <span>Day {w.start}</span>
                  <span className="tt-detail-arrow">→</span>
                  <span>Day {w.end}</span>
                  <span className="tt-detail-dot">·</span>
                  <span>Peak {fmtDay(w.peak)}</span>
                </div>
              </div>
            </div>
            <p className="tt-detail-blurb">{w.blurb}</p>
            <div className="tt-detail-ritual">
              <span className="kicker kicker--mono" style={{ color: w.tone }}>★ Ritual</span>
              <p>{w.ritual}</p>
            </div>
          </div>
        );
      })()}
    </section>
  );
}

window.TransitTimeline = TransitTimeline;
