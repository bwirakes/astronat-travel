/** Default `map-from-home` layout using universal block types. */
export const mfhFallbackBlocksUniversal = [
  {
    blockType: "heroSection",
    kicker: "Workshop",
    titleHtml: 'Map From <span class="text-[var(--color-spiced-life)]">Home!</span>',
    subtitle: `Astrocartography shows you where your energy <strong class="font-secondary italic font-normal text-base md:text-xl text-[var(--text-primary)]">naturally flows, expands, contracts, and thrives</strong> around the world.`,
    callouts: [
      { text: 'Most people think: "I have to move there to feel better"' },
      { text: "But your life doesn't support that now. Work, family, and budgets keep you stuck. Passport is not strong." },
    ],
    primaryCta: { label: "Enroll Now ($397)", href: "#buy" },
    heroImage: "/astronat-hero.jpg",
    layout: "image-right",
    decorativeElement: "saturn-watermark",
    kickerColor: "spiced-life",
    ctaStyle: "rounded",
  },
  {
    blockType: "splitContent",
    layout: "standard",
    bgToken: "charcoal",
    image: "/nat-1.jpg",
    imageSide: "left",
    kicker: "Here's the truth...",
    heading: "You can live that life, right where you are now.",
    body: `<p>You <em class="italic text-[var(--color-acqua)]">don't have to uproot your whole life</em> to work with powerful planetary lines — even the ones that pull you toward places you've never visited.</p>
<p class="font-semibold text-lg font-secondary lowercase mt-6 mb-2">If you've ever felt…</p>
<ul class="space-y-2 opacity-80 list-disc pl-5">
<li class="pl-1">Stuck because travel feels too expensive, too complicated, or simply unrealistic right now</li>
<li class="pl-1">Pulled toward places you don't yet know how to access physically because of logistics (eg: weak passports)</li>
<li class="pl-1">Frustrated that your current location feels "off," but moving isn't an option</li>
</ul>
<p class="font-semibold text-[#fcfaf1] bg-[var(--color-y2k-blue)] inline-block px-3 py-1 mt-4 uppercase tracking-wide text-xs rounded-sm">… then this is MADE for you.</p>`,
  },
  {
    blockType: "splitContent",
    layout: "standard",
    bgToken: "spiced",
    image: "/green_phone.png",
    imageSide: "right",
    heading: "This workshop is created to help those who are stuck where they are.",
    body: `<ul class="space-y-3 font-body opacity-90 text-sm md:text-base text-pretty list-none">
<li>✨ You shouldn't need to cross borders to feel supported by your natal chart's strengths.</li>
<li>✨ You don't need a huge travel or relocation budget to work with your best lines in the world.</li>
<li>✨ And you shouldn't feel "behind" because you have to be realistic about your life.</li>
</ul>
<p class="mt-6 font-primary text-lg md:text-xl text-[#fcfaf1] leading-tight">
I created this workshop for the average person who needs energetic alignment in their life, <em class="italic text-[#111b2e]">but are only able to move domestically within national borders, without breaking the bank.</em>
</p>`,
  },
  {
    blockType: "splitContent",
    layout: "standard",
    bgToken: "raised",
    image: "/nat-2.jpg",
    imageSide: "left",
    kicker: "Context",
    heading: "Why I'm teaching this...",
    body: `<p>As a Singaporean, and as someone who has lived in a region with vast economic disparities, I'm aware that not everyone has the resources to pack up and move abroad — even if they feel called to another place.</p>
<p class="font-secondary italic text-2xl text-[var(--text-primary)]">Relocation isn't always realistic.</p>
<p>For many people, life is built around <strong>family responsibilities, stable income, visas, caregiving, and practical constraints.</strong></p>
<p>Astrocartography is often taught from a Western lens — assuming freedom of movement, disposable income, and ample time. That doesn't consider <strong>a large number of people who are doing their best within real-world limitations.</strong></p>`,
  },
  {
    blockType: "splitContent",
    layout: "standard",
    bgToken: "raised",
    heading: "",
    body: `<div class="flex flex-col items-center text-center max-w-7xl mx-auto w-full px-6">
<h2 class="font-secondary text-3xl md:text-5xl mb-8 leading-tight">This isn't just about moving, it's about...</h2>
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left w-full max-w-2xl font-body text-sm md:text-base text-pretty">
<div class="bg-[var(--surface)] p-5 shadow-sm border border-[var(--surface-border)] rounded-[2rem]">✨ Choosing environments that <strong class="text-[var(--text-primary)]">support your nervous system</strong></div>
<div class="bg-[var(--surface)] p-5 shadow-sm border border-[var(--surface-border)] rounded-[2rem]">✨ Building a life that feels <strong class="text-[var(--text-primary)]">grounded and emotionally sustainable</strong></div>
<div class="bg-[var(--surface)] p-5 shadow-sm border border-[var(--surface-border)] rounded-[2rem]">✨ Learning to trust that <strong class="text-[var(--text-primary)]">you can change your environment</strong> to bring out the best in you</div>
<div class="bg-[var(--surface)] p-5 shadow-sm border border-[var(--surface-border)] rounded-[2rem]">✨ You will finally understand <strong class="text-[var(--text-primary)]">how you're meant to thrive.</strong></div>
</div></div>`,
  },
  {
    blockType: "cardGrid",
    heading: "In this workshop, you'll learn...",
    kicker: "Curriculum",
    columns: "3",
    variant: "numbered",
    sectionBg: "raised",
    cards: [
      { num: "01", title: "Identify Your Lines", desc: "No astrology background needed — I will teach you the fundamentals, and then some. Discover your most supportive planetary lines globally.", glyph: "♀", bgToken: "charcoal", textToken: "eggshell" },
      { num: "02", title: "Remote Activation", desc: "Remote activation techniques that work from where you live. You'll learn how to work with planetary themes energetically and practically.", glyph: "♃", bgToken: "raised", textToken: "primary" },
      { num: "03", title: "Evaluating Charts", desc: "Learn how to properly evaluate your relocated charts. Be truly confident in your knowledge with my comprehensive breakdown.", glyph: "♄", bgToken: "y2k-blue", textToken: "eggshell" },
      { num: "04", title: "Local Space", desc: "Bring supportive energy into your local neighbourhood. Learn how to see local space lines from where you live.", glyph: "♅", bgToken: "raised", textToken: "primary" },
      { num: "05", title: "Spiritual Modalities", desc: "My proprietary blend of astrocartography + spiritual methodologies (like human design and numerology) to maximize the effects.", glyph: "♆", bgToken: "charcoal", textToken: "eggshell" },
      { num: "06", title: "Travel Trackers", desc: "The AstroNat travel worksheet trackers for guided application. Walk away with a clear and robust system you can use again and again.", glyph: "♇", bgToken: "charcoal", textToken: "eggshell" },
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
    headingHtml: 'Why should you <br/> <span class="text-[var(--color-charcoal)]">learn from me?</span>',
    body: `<p>With 6 planets AND the North Node in my 9th house of travel, teaching, publishing, I have <strong>deliberately experimented and travelled</strong> to both supportive and challenging lines to gather this knowledge, and gone through intense and life-altering experiences to gather the knowledge I have. Trust me, I have <em>been through it.</em></p>
<p>In true Capricorn fashion, <strong>I transmute all of that</strong> and have <strong>literally gone to the ends of the earth</strong> to bring you my hard-earned wisdom and real-world knowledge!</p>
<p>Considerable financial and energetic resources were spent to harness my skills, techniques, and insights so that I can create <strong>the most rigorous and value-added workshops</strong> for you.</p>`,
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
    primaryCta: { label: "I want in!", href: "https://astronat.podia.com/map-from-home-workshop/buy?offer_id=4918750" },
    perks: [
      { line: "A 5-module workshop with lifetime access to course updates, quizzes, case studies" },
      { line: "Step-by-step local space & remote activation techniques, supported by solid Astrocartography principles" },
      { line: "Practical checklists that integrate your lines into your life seamlessly" },
      { line: "My specific remedies for you to thrive on challenging Astrocartography lines (super unique!)" },
      { line: "My proprietary blend of other spiritual modalities to give you the best chance of thriving where you are now" },
      { line: "My Astrocartography travel tracker worksheets to help you apply the methods expertly" },
    ],
  },
  {
    blockType: "ctaBand",
    layout: "centered",
    bgToken: "charcoal",
    heading: "Get lifetime access to my signature course for only USD $397!",
    body: `<p>👉 This is THE most comprehensive local space & remote activation workshops out there, with modules and tips that I have not seen in other courses. The methods are designed to be used together for compounded results.</p>
<p>👉 The financial and emotional costs of moving to the wrong city, dating people you are not aligned with or working with business partners from countries which are not your best lines - can be very damaging or traumatic.</p>
<p>👉 The knowledge and value stay with you for the rest of your life, empowering you to make the best decisions for you and your loved ones.</p>`,
    closing: "Invest in the clarity and confidence that you will get from knowing exactly where and how to activate different areas of your life with specific results, both at home and abroad.",
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
      { question: 'What if I live on a "challenging" line right now?', answer: "That's actually one of the best reasons to invest in this course. You'll learn ways to soften, balance, and consciously work with difficult energies rather than feeling stuck or drained by them. You don't have to fight your location—you can work with it wherever you are right now." },
      { question: "Will I need my exact birth time?", answer: "A reasonably accurate birth time is helpful, but not always required. If birth time uncertainty applies to you, you'll still gain value from understanding planetary themes and activation principles." },
      { question: "What are your cancellation & refund policies?", answer: "All my courses and workshops should be purchased only when you feel aligned with my teachings. You have lifetime access to all updates, videos, case studies, live calls & worksheets. This should be a heart-led decision, there are no refunds for any courses." },
    ],
  },
] as const;
