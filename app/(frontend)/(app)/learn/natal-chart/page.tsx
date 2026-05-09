"use client";

import React from "react";
import {
  LessonShell,
  GuideHeader,
  ProseSection,
  PullQuote,
  RelatedGuides,
  Plate,
  NatalWheel,
  KeyStrip,
  ConceptCard,
  ConceptStack,
  GlossaryTerm,
  getLesson,
  getGuides,
} from "../_components";

export default function NatalChartLessonPage() {
  const lesson = getLesson("natal-chart");

  return (
    <LessonShell lessonId="natal-chart">
      <GuideHeader
        guide={lesson}
        title="The Natal"
        titleItalic="Chart"
        lede="Your natal chart is a photograph of the sky taken the exact minute you were born, from the exact geographic coordinates of the hospital. It does not predict your fate, and it is not a personality test. It is a map of the raw material you have been given to work with in this lifetime. Here is how to read the blueprint."
      />

      <ProseSection id="s01" kicker="§ 01" title="What you're looking at">
        <p>
          A natal chart looks like a complex piece of geometry, but it is actually just a clock. The circle represents the 360 degrees of the space surrounding Earth. The horizontal line through the center represents the local horizon. Everything below that line was physically beneath the Earth at the moment of your birth; everything above it was in the sky.
        </p>
        <p>
          Astrologers place three interlocking rings on this circle: the twelve <GlossaryTerm term="Sign">signs of the zodiac</GlossaryTerm> on the outside, the <GlossaryTerm term="Planet">planets</GlossaryTerm> moving through them, and the twelve <GlossaryTerm term="House">houses</GlossaryTerm> anchoring the chart to the ground. Reading a chart means reading how these three rings align.
        </p>

        <Plate number="01" title="The Cosmic Blueprint">
          <NatalWheel accent="var(--color-y2k-blue)" />
          <KeyStrip
            label="ANGLES"
            items={[
              { term: "☉", defn: "Sun" },
              { term: "☽", defn: "Moon" },
              { term: "ASC", defn: "Ascendant" },
            ]}
          />
        </Plate>
      </ProseSection>

      <ProseSection id="s02" kicker="§ 02" title="The four angles">
        <p>
          Before looking at any planets, you must locate the angles. These are the four points of the compass that anchor the chart to the physical location of your birth. The most important is the <GlossaryTerm term="Ascendant">Ascendant</GlossaryTerm> (or rising sign) on the left side of the horizontal line. This is the exact degree of the zodiac that was crossing the eastern horizon when you took your first breath.
        </p>
        <p>
          Directly opposite is the Descendant, representing the western horizon and the realm of partnership. At the very top of the chart is the Midheaven (MC), marking the highest point the sun reached that day—the realm of public life and career. At the bottom is the Imum Coeli (IC), the midnight point representing your deepest roots and private life.
        </p>
      </ProseSection>

      <ProseSection id="s03" kicker="§ 03" title="Planets in houses">
        <p>
          Once the angles are set, the circle is divided into twelve slices called <GlossaryTerm term="House">houses</GlossaryTerm>. If planets represent <em>what</em> is happening (action) and signs represent <em>how</em> it happens (style), houses represent <em>where</em> it happens. 
        </p>
        <p>
          Every house governs a specific department of human life. The 1st house is your physical body and identity. The 7th house is marriage and open enemies. The 10th house is your career. A planet's placement in a house tells you exactly where its energy will manifest most clearly in your life.
        </p>
      </ProseSection>

      <ProseSection id="s04" kicker="§ 04" title="Signs as the outer ring">
        <p>
          The outermost ring of the chart is the <GlossaryTerm term="Zodiac">zodiac</GlossaryTerm>. Think of the signs as stained glass windows. A planet is a light bulb shining from the center of the chart. If the planet of communication (Mercury) shines through the stained glass of Aries (fast, hot, competitive), you get someone who speaks quickly and loves a debate. If it shines through Taurus (slow, grounded, deliberate), you get someone who takes their time to find exactly the right word.
        </p>
      </ProseSection>

      <ProseSection id="s05" kicker="§ 05" title="Reading order">
        <p>
          When you open a chart, do not try to read everything at once. Start with the "Big Three"—the <GlossaryTerm term="Sun">Sun</GlossaryTerm> (core identity), the <GlossaryTerm term="Moon">Moon</GlossaryTerm> (emotional needs), and the Ascendant (the steering wheel of the chart). 
        </p>
        <p>
          Next, look for the ruler of the Ascendant. If your rising sign is Gemini, Mercury is the ruler of your chart. Find Mercury—its house placement shows where your life's main plot will unfold. Finally, look at the <GlossaryTerm term="Aspect">aspects</GlossaryTerm>, the geometric angles between planets (the lines drawn in the center of the wheel). Trines (120°) show flowing energy; squares (90°) show friction and growth.
        </p>
      </ProseSection>

      <ProseSection id="s06" kicker="§ 06" title="A worked example">
        <p>
          Let's synthesize this by looking at a real chart (Jakarta, Aug 17 1988). Below are three focal placements read in context: planet, sign, and house combined.
        </p>
        
        <ConceptStack layout="grid">
          <ConceptCard
            title="The Sun"
            subtitle="Identity & Purpose"
          >
            The Sun is your central identity. In Leo, its natural home, the Sun burns bright and creative; it needs an audience and finds its purpose through self-expression. Placed in the 4th house, that radiance turns inward: identity and purpose are built from private life, family roots, and the concept of home.
          </ConceptCard>
          <ConceptCard
            title="The Moon"
            subtitle="Emotions & Instinct"
          >
            Your Moon is what you need to feel safe. In Libra, safety comes through harmony: conflict feels physically uncomfortable. In the 6th house, emotional equilibrium is tied directly to daily rhythm — when routines break down, the inner world follows.
          </ConceptCard>
          <ConceptCard
            title="Saturn"
            subtitle="Structure & Karma"
          >
            Saturn is where you earned everything the hard way. In Sagittarius, the lesson is philosophical: beliefs must be tested, not inherited. In the 8th house, nothing shared — money, intimacy, power — comes without consequence and accountability.
          </ConceptCard>
        </ConceptStack>
      </ProseSection>

      <PullQuote attribution="— Astro-Nat">
        Every planetary position, sign, and house placement interlocks. The chart is not a list of traits; it is a single, breathing ecosystem.
      </PullQuote>

      <RelatedGuides
        label="Read next"
        guides={getGuides(["houses", "aspects", "astrocartography"])}
      />
    </LessonShell>
  );
}
