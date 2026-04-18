// Header — back button, location breadcrumb, share/save icons (Airbnb-style top chrome)

function ReadingHeader({ location }) {
  return (
    <header className="rh">
      <button className="rh-back" aria-label="Back to Atlas">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className="rh-crumb">
        <img src="assets/saturn-o.svg" className="rh-saturn" alt=""/>
        <span className="rh-crumb-text">
          <span className="rh-crumb-city">{location.name}</span>
          <span className="rh-crumb-sep">·</span>
          <span className="rh-crumb-country">{location.country}</span>
        </span>
      </div>
      <div className="rh-actions">
        <button className="rh-icon" aria-label="Share">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="rh-icon" aria-label="Save">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </header>
  );
}

window.ReadingHeader = ReadingHeader;
