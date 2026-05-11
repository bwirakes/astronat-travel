/** Default `map-from-home` layout using universal block types. */
export const mfhFallbackBlocksUniversal = [
  {
    blockType: "heroSection",
    kicker: "Workshop",
    titleHtml: 'Map From <span class="text-[var(--color-spiced-life)]">Home!</span>',
    subtitle: `Astrocartography shows you where your energy naturally flows, expands, contracts, and thrives around the world.`,
    primaryCta: { label: "Enroll Now ($397)", href: "https://astronat.podia.com/map-from-home-workshop/buy" },
    secondaryCta: { label: "Learn More", href: "#details" },
    heroImage: "/nat-1.jpg",
    layout: "image-right",
    decorativeElement: "rotating-svg",
    kickerColor: "spiced-life",
  },
  {
    blockType: "splitContent",
    layout: "standard",
    bgToken: "charcoal",
    image: "/nat-2.jpg",
    imageSide: "left",
    kicker: "Here's the truth...",
    heading: "You can live that life, right where you are now.",
    body: `<p>You <em class="italic text-[var(--color-acqua)]">don't have to uproot your whole life</em> to work with powerful planetary lines — even the ones that pull you toward places you've never visited.</p>
<p class="font-semibold text-lg font-secondary mt-6 mb-2">If you've ever felt…</p>
<ul class="space-y-2 opacity-80 list-disc pl-5">
<li>Stuck because travel feels too expensive, too complicated, or simply unrealistic right now</li>
<li>Pulled toward places you don't yet know how to access physically because of weak passports or logistics</li>
<li>Frustrated that your current location feels "off," but moving isn't an option</li>
</ul>
<p class="font-semibold text-[#FCFAF1] bg-[var(--color-y2k-blue)] inline-block px-4 py-2 mt-6 uppercase tracking-wider text-xs">… then this workshop is for you.</p>`,
  },
  {
    blockType: "splitContent",
    layout: "standard",
    bgToken: "spiced",
    image: "/nat-3.jpg",
    imageSide: "right",
    heading: "This workshop is for those stuck where they are.",
    body: `<ul class="space-y-4 font-body opacity-90">
<li>✨ You shouldn't need to cross borders to feel supported by your natal chart's strengths.</li>
<li>✨ You don't need a huge travel or relocation budget to work with your best lines in the world.</li>
<li>✨ And you shouldn't feel "behind" because you have to be realistic about your life.</li>
</ul>
<p class="mt-8 font-primary text-xl md:text-2xl leading-tight">
I created this for the person who needs energetic alignment, <em class="italic">but is only able to move domestically, without breaking the bank.</em>
</p>`,
  },
  {
    blockType: "splitContent",
    layout: "standard",
    bgToken: "raised",
    image: "/nat-1.jpg",
    imageSide: "left",
    kicker: "Context",
    heading: "Why I'm teaching this...",
    body: `<p>As a Singaporean, I'm aware that not everyone has the resources to pack up and move abroad — even if they feel called to another place.</p>
<p class="font-secondary italic text-2xl text-[var(--color-y2k-blue)] my-6">Relocation isn't always realistic.</p>
<p>For many, life is built around family responsibilities, stable income, visas, and practical constraints. Often, Astrocartography assumes freedom of movement, which doesn't consider the reality for many people.</p>`,
  },
  {
    blockType: "cardGrid",
    heading: "In this workshop, you'll learn...",
    kicker: "Curriculum",
    columns: "3",
    variant: "numbered",
    sectionBg: "raised",
    cards: [
      { num: "01", title: "Identify Your Lines", desc: "No astrology background needed. Discover your most supportive planetary lines globally.", bgToken: "charcoal" },
      { num: "02", title: "Remote Activation", desc: "Techniques that work from where you live. Learn how to work with planetary themes energetically.", bgToken: "raised" },
      { num: "03", title: "Evaluating Charts", desc: "Learn how to properly evaluate your relocated charts and be truly confident in your knowledge.", bgToken: "y2k-blue" },
      { num: "04", title: "Local Space", desc: "Bring supportive energy into your local neighborhood. See lines from where you live.", bgToken: "raised" },
      { num: "05", title: "Spiritual Modalities", desc: "My proprietary blend of astrocartography + Human Design and Numerology.", bgToken: "charcoal" },
      { num: "06", title: "Travel Trackers", desc: "The AstroNat travel worksheet trackers for a clear system you can use again and again.", bgToken: "charcoal" },
    ],
  },
  {
    blockType: "pullQuote",
    quote: '"Our house is our corner of the world. As has often been said, it is our first universe, a real cosmos in every sense of the word."',
    attribution: "Gaston Bachelard",
    bgToken: "charcoal",
  },
  {
    blockType: "splitContent",
    layout: "standard",
    bgToken: "y2k-blue",
    kicker: "Authority",
    headingHtml: 'Why should you <br/> <span class="text-[#FCFAF1]">learn from me?</span>',
    body: `<p>With a 9th house stellium, I have deliberately experimented and traveled to gather this knowledge through intense and life-altering experiences. Trust me, I have <em>been through it.</em></p>
<p>I transmute my hard-earned wisdom into the most rigorous and value-added workshops for you.</p>`,
    image: "/nat-3.jpg",
    imageSide: "right",
  },
  {
    blockType: "ctaBand",
    layout: "two-column",
    bgToken: "eggshell",
    kicker: "Action",
    headingHtml: 'What you\'ll get <br/> in the <br/><span class="text-[var(--color-y2k-blue)]">Workshop.</span>',
    priceLine: "$397",
    primaryCta: { label: "I want in!", href: "https://astronat.podia.com/map-from-home-workshop/buy" },
    perks: [
      { line: "5-module workshop with lifetime access to updates" },
      { line: "Step-by-step local space & remote activation techniques" },
      { line: "Practical checklists and proprietary remedies" },
      { line: "Astrocartography travel tracker worksheets" },
    ],
  },
  {
    blockType: "ctaBand",
    layout: "centered",
    bgToken: "charcoal",
    heading: "Get lifetime access for only USD $397!",
    body: `<p>👉 The most comprehensive local space & remote activation workshop available.</p>
<p>👉 Save yourself from the damaging financial and emotional costs of moving to the wrong city.</p>
<p>👉 Knowledge that stays with you for life, empowering every future move.</p>`,
    closing: "Invest in your clarity and confidence today.",
  },
  {
    blockType: "faqAccordion",
    heading: "Intelligence FAQ",
    kicker: "Queries",
    items: [
      { question: "Is this workshop for everyone?", answer: "Absolutely! Everyone should have access to such knowledge to improve their current living conditions. The concepts are applicable to everyone regardless of nationality, race or ethnicity." },
      { question: "Will this change my circumstances overnight?", answer: "This is not a magic spell or instant fix. Your natal chart will always be the dominant influence. Remote activation works by shifting how you interact with energy, opportunities, and environments over time. Many people notice subtle but meaningful changes in clarity, ease, and momentum shortly after—but results depend on consistent engagement and practice." },
      { question: "Do I need to travel or move to benefit from this workshop?", answer: "Not at all! This workshop is specifically designed for people who can't or don't want to relocate right now. You'll learn practical ways to work with supportive planetary lines from anywhere in the world—without packing up your life or booking a flight." },
      { question: "Do I need to understand astrology or astrocartography beforehand?", answer: "Not at all. Everything is explained in simple, accessible language. You don't need to know how to read charts or maps in advance—this workshop walks you through what matters and how to apply it." },
      { question: "Can remote activation replace moving to a better location?", answer: "Remote activation is not a replacement for relocation—it's a powerful alternative. For many people, it helps reduce challenging energies where they are and call in supportive ones until moving becomes possible (or no longer necessary)." },
      { question: "What if I live on a \"challenging\" line right now?", answer: "That's actually one of the best reasons to invest in this course. You'll learn ways to soften, balance, and consciously work with difficult energies rather than feeling stuck or drained by them. You don't have to fight your location—you can work with it wherever you are right now." },
      { question: "Will I need my exact birth time?", answer: "A reasonably accurate birth time is helpful, but not always required. If birth time uncertainty applies to you, you'll still gain value from understanding planetary themes and activation principles." },
      { question: "What are your cancellation & refund policies?", answer: "All my courses and workshops should be purchased only when you feel aligned with my teachings. You have lifetime access to all updates, videos, case studies, live calls & worksheets. This should be a heart-led decision, there are no refunds for any courses." },
    ],
  },
] as const;
