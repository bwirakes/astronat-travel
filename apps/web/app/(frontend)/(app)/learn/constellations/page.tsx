"use client";

import React from "react";
import {
  LessonShell,
  GuideHeader,
  ProseSection,
  PullQuote,
  RelatedGuides,
  Plate,
  GlossaryTerm,
  getLesson,
  getGuides,
} from "../_components";

// ═══════════════════════════════════════════════════════════════
// SVG DATA
// ═══════════════════════════════════════════════════════════════

const CONSTELLATIONS = [
  { id: "aries", dots: [{x: 50, y: 400}, {x: 90, y: 370}, {x: 120, y: 420}] },
  { id: "taurus", dots: [{x: 150, y: 300}, {x: 190, y: 280}, {x: 210, y: 330}, {x: 170, y: 350}] },
  { id: "gemini", dots: [{x: 300, y: 400}, {x: 330, y: 370}, {x: 370, y: 420}, {x: 350, y: 460}] },
  { id: "cancer", dots: [{x: 450, y: 150}, {x: 480, y: 120}, {x: 510, y: 160}] },
  { id: "leo", dots: [{x: 100, y: 100}, {x: 150, y: 80}, {x: 200, y: 120}, {x: 180, y: 180}, {x: 120, y: 160}] },
  { id: "virgo", dots: [{x: 250, y: 80}, {x: 300, y: 50}, {x: 330, y: 110}, {x: 280, y: 130}] },
  { id: "libra", dots: [{x: 600, y: 100}, {x: 640, y: 80}, {x: 680, y: 130}, {x: 620, y: 150}] },
  { id: "scorpio", dots: [{x: 650, y: 300}, {x: 690, y: 280}, {x: 730, y: 330}, {x: 700, y: 380}, {x: 660, y: 350}] },
  { id: "sagittarius", dots: [{x: 550, y: 400}, {x: 600, y: 370}, {x: 630, y: 420}, {x: 580, y: 460}] },
  { id: "capricorn", dots: [{x: 720, y: 200}, {x: 750, y: 170}, {x: 780, y: 220}, {x: 740, y: 250}] },
  { id: "aquarius", dots: [{x: 400, y: 300}, {x: 450, y: 280}, {x: 480, y: 320}, {x: 420, y: 350}] },
  { id: "pisces", dots: [{x: 500, y: 250}, {x: 540, y: 220}, {x: 570, y: 280}, {x: 520, y: 300}] }
];

function StarMap() {
  return (
    <div style={{ width: "100%", height: "auto", aspectRatio: "800/500", backgroundColor: "#000" }}>
      <svg viewBox="0 0 800 500" style={{ width: "100%", height: "100%", opacity: 0.85 }}>
        {CONSTELLATIONS.map((c) => (
          <g key={c.id}>
            <path 
              d={`M ${c.dots.map(d => `${d.x} ${d.y}`).join(" L ")} Z`}
              fill="none"
              stroke="var(--gold)"
              strokeWidth="1.5"
              opacity="0.4"
            />
            {c.dots.map((d, di) => (
              <circle key={di} cx={d.x} cy={d.y} r="3" fill="var(--color-eggshell)" style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))" }} />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function ConstellationsLessonPage() {
  const lesson = getLesson("constellations");

  return (
    <LessonShell lessonId="constellations">
      <GuideHeader
        guide={lesson}
        title="The"
        titleItalic="Constellations"
        lede="If you ask an astronomer what your sign is, they will tell you that astrology is broken. They will point their telescope at the sky on the day you were born and show you that the Sun was not in Aries, it was in Pisces. They are right about the astronomy, but they are wrong about what it means."
      />

      <ProseSection id="s01" kicker="§ 01" title="Signs vs. Constellations">
        <p>
          Two thousand years ago, the zodiac sign of Aries perfectly aligned with the physical constellation of stars called Aries. Today, they are off by nearly an entire sign. This discrepancy is the single most common criticism leveled at astrology.
        </p>
        <p>
          The confusion stems from a shared name. A <GlossaryTerm term="Constellation">constellation</GlossaryTerm> is an actual, physical grouping of stars located millions of lightyears away. A <GlossaryTerm term="Zodiac">zodiac sign</GlossaryTerm> is a mathematical slice of longitude measured from the Earth's perspective. They are two different measuring tapes that used to line up perfectly. Now, they don't.
        </p>
        <Plate number="01" title="The Mythic Star Map">
          <StarMap />
        </Plate>
      </ProseSection>

      <ProseSection id="s02" kicker="§ 02" title="The Mechanics of Precession">
        <p>
          Why did they drift apart? The answer is a phenomenon called the <GlossaryTerm term="Precession of the Equinoxes">precession of the equinoxes</GlossaryTerm>. 
        </p>
        <p>
          The Earth is not a perfect sphere; it bulges slightly at the equator. Because of this bulge, the gravitational pull of the Sun and the Moon causes the Earth to wobble on its axis like a spinning top that is slowing down. This wobble is incredibly slow. It takes about 26,000 years for the Earth to complete one full rotation of this wobble.
        </p>
        <p>
          Because the Earth's axis is wobbling, the background of stars appears to slowly shift backward from our perspective. Every 72 years, the background stars move about one degree. Over two millennia, this slow drift has added up to nearly 24 degrees—meaning the signs and the constellations no longer match.
        </p>
      </ProseSection>

      <ProseSection id="s03" kicker="§ 03" title="Tropical Astrology">
        <p>
          When faced with this drift, astrologers had a choice: follow the stars, or follow the Earth. 
        </p>
        <p>
          Western astrology (known as the <GlossaryTerm term="Tropical Zodiac">Tropical Zodiac</GlossaryTerm>) chose the Earth. It anchors the start of the zodiac (0° Aries) to the moment of the vernal equinox—the exact moment the Sun crosses the equator and spring begins in the Northern Hemisphere. It does not matter what background stars happen to be behind the Sun on that day; 0° Aries is defined by the relationship between the Earth and the Sun.
        </p>
        <p>
          This means Western astrology is fundamentally seasonal, not stellar. You are not an Aries because you were born under a cluster of stars shaped like a ram. You are an Aries because you were born in the first 30 days following the spring equinox, when life forces its way out of the ground.
        </p>
      </ProseSection>

      <PullQuote attribution="— Astro-Nat">
        We do not read the distant stars. We read the immediate, seasonal geometry of the solar system we live in.
      </PullQuote>

      <RelatedGuides
        label="Read next"
        guides={getGuides(["natal-chart", "viewing-the-stars", "houses"])}
      />
    </LessonShell>
  );
}
