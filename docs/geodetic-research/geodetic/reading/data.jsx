/* ═══ Shared reading data — Bali deep-dive ═══════════════════════════════
   Fabricated but astrologically coherent geodetic reading for a user
   whose relocated chart in Ubud, Bali puts Venus on the IC and Jupiter
   near the Descendant — the classic "spiritual retreat + relationship
   softening" combo. Forecast window: Apr 18 → Jul 17, 2026 (90 days).
   ═════════════════════════════════════════════════════════════════════ */

const READING = {
  location: {
    city: 'Ubud',
    region: 'Bali, Indonesia',
    lat: -8.5069,
    lon: 115.2625,
    localTime: '14:47 WITA',
    tz: 'GMT+8',
  },
  generated: 'Apr 18, 2026 · 09:12 PDT',
  resonance: 88,
  tagline: {
    serif: 'The Ubud',
    script: 'opening',
  },
  hook: "Ubud is one of four places on Earth where Venus sits exactly on your IC right now. That makes it — astrologically speaking — a kind of temporary home. Three clean travel windows open in the next ninety days; each is short, each has a different flavor. Pick the one that fits your calendar.",
  // Three recommended travel windows inside the 90-day horizon
  travelWindows: [
    { n: 1, rank: 'Best overall',  dates: 'May 12 – May 22, 2026', days: '10 nights', score: 94, note: 'Venus on IC is exact, Sun trines your Moon. Arrival-and-settle weather.', color: 'var(--color-spiced-life)' },
    { n: 2, rank: 'Meeting people', dates: 'Jun 1 – Jun 10, 2026',  days: '9 nights',  score: 88, note: 'Jupiter conjunct DSC, exact mid-window. Go if you want teachers or a new friend.', color: 'var(--gold)' },
    { n: 3, rank: 'Quiet retreat',  dates: 'Jul 6 – Jul 14, 2026',  days: '8 nights',  score: 82, note: 'Venus returns exact. Good window to commit — to a person, place, or practice.', color: 'var(--color-y2k-blue)' },
  ],
  // Four-image mosaic, Airbnb style
  photos: [
    { src: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&auto=format&fit=crop', alt: 'Rice terraces at Tegallalang' },
    { src: 'https://images.unsplash.com/photo-1604665177941-c00946329a17?w=900&auto=format&fit=crop', alt: 'Temple gate at dawn' },
    { src: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=900&auto=format&fit=crop', alt: 'Quiet pavilion in the jungle' },
    { src: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=900&auto=format&fit=crop', alt: 'Frangipani offerings' },
  ],
  // Planetary lines crossing within 300km of Ubud
  lines: [
    { planet: 'Venus',   glyph: '♀', angle: 'IC',  dist: 0,    color: 'var(--color-planet-venus)',   note: 'Direct hit — home, belonging, aesthetic.' },
    { planet: 'Jupiter', glyph: '♃', angle: 'DSC', dist: 47,   color: 'var(--color-planet-jupiter)', note: 'Generous relationships, teachers, expansion in partnership.' },
    { planet: 'Neptune', glyph: '♆', angle: 'MC',  dist: 188,  color: 'var(--color-planet-neptune)', note: 'Calling dissolves / refines — watch for blur.' },
    { planet: 'Moon',    glyph: '☽', angle: 'ASC', dist: 260,  color: 'var(--color-planet-moon)',    note: 'Body softens, emotions closer to the surface.' },
  ],
  // 30 / 60 / 90 day Gantt windows (day offset from today)
  windows: [
    { planet: 'Venus',   glyph: '♀', aspect: 'conjunct IC',      start:  0, end: 22, peak:  9, strength: 0.95, color: 'var(--color-planet-venus)',   label: 'The arrival' },
    { planet: 'Sun',     glyph: '☉', aspect: 'trine natal Moon', start:  4, end: 12, peak:  8, strength: 0.62, color: 'var(--gold)',                 label: 'Soft focus' },
    { planet: 'Mercury', glyph: '☿', aspect: 'through 4th house',start: 14, end: 38, peak: 26, strength: 0.54, color: 'var(--color-planet-mercury)', label: 'Journaling returns' },
    { planet: 'Jupiter', glyph: '♃', aspect: 'conjunct DSC',     start: 18, end: 64, peak: 41, strength: 0.88, color: 'var(--color-planet-jupiter)', label: 'Meeting your people' },
    { planet: 'Mars',    glyph: '♂', aspect: 'square Saturn',    start: 42, end: 58, peak: 50, strength: 0.48, color: 'var(--color-planet-mars)',    label: 'Friction, useful' },
    { planet: 'Neptune', glyph: '♆', aspect: 'sextile MC',       start: 30, end: 90, peak: 72, strength: 0.71, color: 'var(--color-planet-neptune)', label: 'A calling clarifies' },
    { planet: 'Venus',   glyph: '♀', aspect: 'return, exact',    start: 76, end: 84, peak: 80, strength: 0.90, color: 'var(--color-planet-venus)',   label: 'The second bloom' },
  ],
  // "What you'll experience" — Airbnb numbered steps
  steps: [
    {
      n: 1,
      title: 'A softening of pace',
      body: 'Your first fortnight, the relocated Moon in the 4th pulls rest up from the floor. Sleep deepens. You will feel, as one client put it, "like I finally stopped holding my breath."',
      window: 'Days 1–14',
      img: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&auto=format&fit=crop',
    },
    {
      n: 2,
      title: 'A meeting that recalibrates',
      body: 'Jupiter arrives on your Descendant around day 18. Someone — teacher, friend, possibly both — will casually reframe a question you have been carrying for two years.',
      window: 'Days 18–35',
      img: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop',
    },
    {
      n: 3,
      title: 'The useful friction',
      body: 'Mars squares Saturn mid-forecast. Something you have been avoiding — a conversation, a contract, a decision about staying — demands a quiet answer. Not a dramatic one.',
      window: 'Days 42–58',
      img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop',
    },
    {
      n: 4,
      title: 'A second, quieter bloom',
      body: 'Venus returns exact in the final week. Whatever opened in month one comes back around with evidence. This is the window to commit — to a person, a place, or a practice.',
      window: 'Days 76–90',
      img: 'https://images.unsplash.com/photo-1604997781056-a2c6b2b8e4c0?w=800&auto=format&fit=crop',
    },
  ],
  // Weekly narrative — trimmed to 13 weeks (~90 days)
  weeks: [
    { w: 1,  range: 'Apr 18 – Apr 24', title: 'Arrival',              body: 'Venus exact on IC. Unpack slowly. The first three nights\' sleep will tell you more than the next three months of journaling.' },
    { w: 2,  range: 'Apr 25 – May 1',  title: 'A room of your own',   body: 'Find the space you\'ll return to every morning. Saturn wants ritual; Venus wants it beautiful. Both can be true.' },
    { w: 3,  range: 'May 2 – May 8',   title: 'First introductions',  body: 'Mercury in your 3rd. Accept invitations you would normally decline. One name you hear this week will matter in July.' },
    { w: 4,  range: 'May 9 – May 15',  title: 'The soft study',       body: 'Sun trine Moon. Learn something that requires your hands — cooking, weaving, stone. Ideas absorb faster through the body right now.' },
    { w: 5,  range: 'May 16 – May 22', title: 'Meeting your people',  body: 'Jupiter moves onto your Descendant. This is the week for the dinner you\'ve been putting off. Sit with strangers; leave with friends.' },
    { w: 6,  range: 'May 23 – May 29', title: 'Expansion tested',     body: 'Jupiter is generous but not free. Something will stretch your trust — a shared project, a loan of time, a question about commitment.' },
    { w: 7,  range: 'May 30 – Jun 5',  title: 'The long conversation',body: 'Mercury retrograde-station in your 4th. A conversation with family (or a family-of-choice) that you\'ve been editing for a year, finally happens.' },
    { w: 8,  range: 'Jun 6 – Jun 12',  title: 'Friction',             body: 'Mars squares Saturn. You will want to storm out of somewhere. Don\'t — but do name the thing you\'re storming about. Quietly.' },
    { w: 9,  range: 'Jun 13 – Jun 19', title: 'Repair',               body: 'Venus supports the Moon. Small kindnesses land heavily. Apologize for the thing you\'ve been rehearsing; it will be received more gently than you expect.' },
    { w: 10, range: 'Jun 20 – Jun 26', title: 'The calling clarifies',body: 'Neptune sextile your relocated MC. A vocational image you\'ve dismissed for being too dreamy, returns with specifics this week.' },
    { w: 11, range: 'Jun 27 – Jul 3',  title: 'Quiet alignment',      body: 'Sun crosses your IC. Mid-forecast integration. Write down, in one paragraph, what you\'re different about. Read it in six months.' },
    { w: 12, range: 'Jul 4 – Jul 10',  title: 'Evidence',             body: 'Jupiter exact on Descendant one more time. The meeting from Week 5 comes full circle — usually as a concrete offer, sometimes as a choice to walk away.' },
    { w: 13, range: 'Jul 11 – Jul 17', title: 'The second bloom',     body: 'Venus return, exact. Whatever you opened in April, commit to or close. The door doesn\'t slam — it just quietly stops being unlocked.' },
  ],
  // Ritual prompts tied to windows
  rituals: [
    { when: 'Days 1–14',  title: 'Three-night threshold', body: 'For the first three evenings, write one sentence about what you heard — not what you thought. Venus on IC listens first, speaks later.', glyph: '♀' },
    { when: 'Days 18–35', title: 'The one question',      body: 'Prepare a single open question and carry it. When Jupiter\'s person arrives, you\'ll recognize them because they answer before you ask.', glyph: '♃' },
    { when: 'Days 42–58', title: 'The small no',          body: 'Practice one polite refusal per day. Mars square Saturn rewards boundaries stated without theatre.', glyph: '♂' },
    { when: 'Days 60–80', title: 'Evening walk, west',    body: 'Walk toward the sunset, alone, three times a week. Neptune on the relocated MC needs unstructured horizon to do its best thinking.', glyph: '♆' },
    { when: 'Days 76–90', title: 'The second letter',     body: 'Rewrite, by hand, the first entry you made on arrival. The gap between the two drafts is the actual reading.', glyph: '♀' },
  ],
};

window.READING = READING;
