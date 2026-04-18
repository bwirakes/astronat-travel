// Ritual Prompts — small action cards tied to active windows

function RitualPrompts({ windows, horizon }) {
  const visible = windows.filter(w => w.start < horizon);
  return (
    <section className="rp">
      <div className="rp-head">
        <span className="kicker kicker--mono" style={{ color: 'var(--gold)' }}>★ Ritual cards · a small thing to do</span>
        <h2 className="rp-title">
          Prompts for the<span className="script">&nbsp;days&nbsp;</span>that matter
        </h2>
      </div>
      <div className="rp-grid">
        {visible.map((w, i) => (
          <article key={w.id} className="rp-card" style={{ borderTop: `2px solid ${w.tone}` }}>
            <div className="rp-card-head">
              <span className="rp-card-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="rp-card-glyph" style={{ color: w.tone }}>{w.planet}</span>
            </div>
            <div className="rp-card-when">
              <span style={{ color: w.tone }}>Day {w.peak}</span>
              <span className="rp-card-dot">·</span>
              <span>{w.planetName} {w.line.split(' ')[0]}</span>
            </div>
            <p className="rp-card-text">{w.ritual}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

window.RitualPrompts = RitualPrompts;
