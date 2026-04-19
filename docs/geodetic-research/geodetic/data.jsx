// Bali reading data — Planetary transits over the next 90 days for relocated chart.
// This is a single sample reading used by the page.

window.READING = {
  location: {
    name: 'Ubud',
    country: 'Bali, Indonesia',
    lat: '-8.5069°',
    lng: '115.2625°',
    tz: 'WITA · UTC+8',
  },
  score: 88,
  headline: {
    kicker: '★ Reading · 18·04·26 · Relocated',
    caps_top: 'The Bali',
    script: 'unwinding',
    caps_bottom: '',
  },
  lede:
    "Venus moves onto your relocated Descendant two weeks after you land — and keeps moving. " +
    "The next ninety days in Ubud are about being met: by other people, by your own softness, by a slower clock. " +
    "The chart wants you horizontal before it wants you anything else.",
  photos: [
    // 2x2 mosaic — placeholder Unsplash Bali/Ubud imagery
    { src: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80', alt: 'Rice terraces' },
    { src: 'https://images.unsplash.com/photo-1518544801976-3e159e50e5bb?w=900&q=80', alt: 'Temple detail' },
    { src: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=900&q=80', alt: 'Palm canopy' },
    { src: 'https://images.unsplash.com/photo-1604999333679-b86d54738315?w=900&q=80', alt: 'Warung morning' },
  ],
  // Gantt-style transit windows — days are offsets from today (0 = today)
  // Full horizon shown is 90 days. We filter by the active window.
  windows: [
    { id: 'ven-dc', planet: '♀', planetName: 'Venus', line: 'DC · 7th house', start: 4, end: 38, peak: 21, tone: 'var(--color-spiced-life)',
      title: 'Venus crosses your Descendant',
      blurb: 'Partnership weather. Old friends surface. A soft romance with place itself.',
      ritual: 'On day 21, eat alone at the same warung you went to on day 4. Watch what changed.' },
    { id: 'moon-ic', planet: '☽', planetName: 'Moon node', line: 'IC · 4th house', start: 0, end: 16, peak: 8, tone: 'var(--color-acqua)',
      title: 'North Node at your IC',
      blurb: 'The first fortnight is about floor: where you sleep, what your kitchen smells like.',
      ritual: 'Sleep with the windows open for the first 9 nights. Don\'t unpack fully until day 10.' },
    { id: 'jup-asc', planet: '♃', planetName: 'Jupiter', line: 'AC · 1st house', start: 19, end: 58, peak: 34, tone: 'var(--amber)',
      title: 'Jupiter conjunct your Ascendant',
      blurb: 'You are seen here. Strangers will ask you things. Say yes more than you\'d say at home.',
      ritual: 'One new introduction per day, week 4 through week 7. Keep a small list.' },
    { id: 'sat-mc', planet: '♄', planetName: 'Saturn', line: 'MC square', start: 42, end: 74, peak: 58, tone: 'var(--color-eggshell)',
      title: 'Saturn squares your Midheaven',
      blurb: 'The low hum of career. Not a crisis — a structural question. Don\'t reply to it from the bungalow.',
      ritual: 'Block day 58. No work, no pitches, no replying-to-Slack-just-this-once.' },
    { id: 'nep-mc', planet: '♆', planetName: 'Neptune', line: 'MC trine', start: 55, end: 90, peak: 78, tone: 'var(--color-y2k-blue)',
      title: 'Neptune trines your Midheaven',
      blurb: 'A vocation opens in peripheral vision. You\'ll know it because it doesn\'t feel urgent.',
      ritual: 'On day 78, write for one uninterrupted hour, longhand, somewhere with water nearby.' },
  ],
  // Weekly narrative (up to 12 weeks, we show based on window)
  weeks: [
    { n: 1, title: 'Arrival body', thumb: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=400&q=80',
      note: 'Sleep, water, the same breakfast three mornings in a row. Venus hasn\'t moved yet — don\'t rush her.' },
    { n: 2, title: 'The first faces', thumb: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&q=80',
      note: 'You meet someone on day 11 or 12 who you\'ll still text from wherever comes next.' },
    { n: 3, title: 'Venus peak', thumb: 'https://images.unsplash.com/photo-1518544801976-3e159e50e5bb?w=400&q=80',
      note: 'The softest stretch. Accept every invitation. This window closes around day 24.' },
    { n: 4, title: 'Jupiter switches on', thumb: 'https://images.unsplash.com/photo-1604999333679-b86d54738315?w=400&q=80',
      note: 'Things get bigger. A room opens up, a side-project finds you. Say yes, then ask questions.' },
    { n: 5, title: 'Expansion tension', thumb: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
      note: 'Over-commitment risk. Journal before agreeing to anything after 9pm.' },
    { n: 6, title: 'The center week', thumb: 'https://images.unsplash.com/photo-1534351590666-13e3e96c5017?w=400&q=80',
      note: 'Exactly what you came for. Protect it — no flights, no calls home, no decisions.' },
    { n: 7, title: 'Saturn\'s knock', thumb: 'https://images.unsplash.com/photo-1552751753-0fc84ae2b992?w=400&q=80',
      note: 'Work will find you. It wants a smaller answer than you think. One honest email.' },
    { n: 8, title: 'Course correction', thumb: 'https://images.unsplash.com/photo-1518509562904-e7ef99cddc85?w=400&q=80',
      note: 'The rental, the routine, the people — one of the three needs editing. You\'ll know which.' },
    { n: 9, title: 'The second arrival', thumb: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
      note: 'You\'ve been here long enough to drop the tourist shoulder. A different place reveals itself.' },
    { n: 10, title: 'Neptune opens', thumb: 'https://images.unsplash.com/photo-1518544801976-3e159e50e5bb?w=400&q=80',
      note: 'A vocational whisper — an idea, a teacher, a practice. Write it down without trying to solve it.' },
    { n: 11, title: 'The long view', thumb: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&q=80',
      note: 'You\'ll catch yourself making a plan for next spring. Let it be a plan, not a promise.' },
    { n: 12, title: 'Leaving clean', thumb: 'https://images.unsplash.com/photo-1604999333679-b86d54738315?w=400&q=80',
      note: 'Final week. Give away one object. Tip the person who made your coffee. The chart closes on a thank-you.' },
  ],
  // Lines crossing Bali (for the map)
  lines: [
    { planet: '♀', planetName: 'Venus', line: 'DC', tone: 'var(--color-spiced-life)', offset_km: 42, dir: 'E' },
    { planet: '♃', planetName: 'Jupiter', line: 'AC', tone: 'var(--amber)', offset_km: 118, dir: 'NW' },
    { planet: '♆', planetName: 'Neptune', line: 'MC', tone: 'var(--color-y2k-blue)', offset_km: 210, dir: 'N' },
    { planet: '♄', planetName: 'Saturn', line: 'IC', tone: 'var(--color-eggshell)', offset_km: 340, dir: 'S' },
  ],
};
