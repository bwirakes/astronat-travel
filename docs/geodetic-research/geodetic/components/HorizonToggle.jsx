// Forecast horizon toggle (30/60/90) + sticky mini-header that appears when scrolled

function HorizonToggle({ value, onChange }) {
  const opts = [30, 60, 90];
  return (
    <div className="ht">
      <span className="kicker kicker--mono" style={{ color: 'var(--text-tertiary)' }}>Forecast window</span>
      <div className="ht-pills">
        {opts.map(d => (
          <button
            key={d}
            className={`ht-pill ${value === d ? 'ht-pill--on' : ''}`}
            onClick={() => onChange(d)}
          >
            {d} days
          </button>
        ))}
      </div>
    </div>
  );
}

window.HorizonToggle = HorizonToggle;
