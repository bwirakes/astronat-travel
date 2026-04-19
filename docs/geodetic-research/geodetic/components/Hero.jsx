// Hero — 2x2 photo mosaic (Airbnb-style) + headline block below

function Hero({ reading }) {
  const { photos, headline, lede, location, score } = reading;
  return (
    <section className="hero">
      <div className="hero-mosaic">
        <div className="hero-mosaic-tile hero-mosaic-tile--lead">
          <img src={photos[0].src} alt={photos[0].alt}/>
          <span className="hero-tile-kicker">★ Relocated · {location.lat} {location.lng}</span>
        </div>
        <div className="hero-mosaic-col">
          <div className="hero-mosaic-tile">
            <img src={photos[1].src} alt={photos[1].alt}/>
          </div>
          <div className="hero-mosaic-tile">
            <img src={photos[2].src} alt={photos[2].alt}/>
          </div>
        </div>
        <div className="hero-mosaic-tile hero-mosaic-tile--wide">
          <img src={photos[3].src} alt={photos[3].alt}/>
          <button className="hero-all-photos">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            All 24 photos
          </button>
        </div>
      </div>

      <div className="hero-copy">
        <div className="hero-kicker">{headline.kicker}</div>
        <h1 className="hero-title">
          {headline.caps_top}
          <span className="script">{headline.script}</span>
        </h1>
        <div className="hero-meta">
          <span>{location.name}, {location.country}</span>
          <span className="hero-meta-sep">/</span>
          <span>{location.tz}</span>
          <span className="hero-meta-sep">/</span>
          <span className="hero-meta-score">Resonance <b>{score}</b></span>
        </div>
        <p className="hero-lede">{lede}</p>
      </div>
    </section>
  );
}

window.Hero = Hero;
