// Footer — reading metadata, contemplative (no CTA)

function ReadingFooter({ reading }) {
  return (
    <footer className="rf">
      <div className="rf-rule"/>
      <div className="rf-body">
        <div className="rf-sig">
          <img src="assets/saturn-o-stars.svg" className="rf-saturn"/>
          <div>
            <div className="rf-sig-line">
              <span className="script">so,</span>
            </div>
            <div className="rf-sig-main">{reading.location.name.toUpperCase()}.</div>
          </div>
        </div>
        <div className="rf-meta">
          <dl>
            <dt>Reading cast</dt><dd>18·04·26 · 04:42 WITA</dd>
            <dt>Natal chart</dt><dd>04·17·94 · Brooklyn</dd>
            <dt>Method</dt><dd>Relocated Placidus · ACG lines</dd>
            <dt>Calculations</dt><dd>847 aspects · 23 transits</dd>
            <dt>Narrative model</dt><dd>Gemini 2.5 · trained on 712 traveler logs</dd>
          </dl>
        </div>
      </div>
      <div className="rf-foot">
        <span>AstroNat · Elevated Editorial / 90s Aquarian</span>
        <span className="rf-foot-sep">★</span>
        <span>Readings are contemplative, not prescriptive.</span>
      </div>
    </footer>
  );
}

window.ReadingFooter = ReadingFooter;
