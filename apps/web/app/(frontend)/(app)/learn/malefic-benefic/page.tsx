"use client";

import React from "react";
import {
  LessonShell,
  GuideHeader,
  ProseSection,
  PullQuote,
  RelatedGuides,
  ConceptCard,
  ConceptStack,
  GlossaryTerm,
  getLesson,
  getGuides,
} from "../_components";

// ═══════════════════════════════════════════════════════════════
// PLANETARY DATA
// ═══════════════════════════════════════════════════════════════

const PLANETS = [
  {
    id: "jupiter",
    name: "Jupiter",
    role: "Greater Benefic",
    glyph: "♃",
    color: "#C9A96E",
    desc: "Jupiter is the planet of the open door. He expands whatever he touches: opportunities multiply, people are generous, the path forward is visible. His gifts are macro-level and life-changing — not the small comfort of Venus, but the large reorientation: a new philosophy, a windfall, a mentor who arrives at exactly the right time. Wherever Jupiter sits in your chart is where the universe is most likely to say yes.",
  },
  {
    id: "venus",
    name: "Venus",
    role: "Lesser Benefic",
    glyph: "♀",
    color: "#CAF1F0",
    desc: "Venus is the sensation of walking into a room and immediately feeling welcome. She is the principle of magnetic attraction — how you draw things in without strain, where beauty seems to follow you naturally. Her blessings are personal and immediate: love that flows easily, art that comes through you, the ease of being liked. Look at Venus to understand both what you love, and more importantly, what you believe you deserve to receive.",
  },
  {
    id: "saturn",
    name: "Saturn",
    role: "Greater Malefic",
    glyph: "♄",
    color: "#909090",
    desc: "Saturn is the Greater Malefic — not because he is evil, but because his lessons are slow, heavy, and arrive without apology. He brings restriction, cold boundaries, and the kind of discipline that can only come from having no other option. His timeline is decades, not months. But what Saturn builds, nothing dismantles. The mastery you earn in the house Jupiter helps effortlessly is shallow. The mastery you earn in the house Saturn rules is permanent.",
  },
  {
    id: "mars",
    name: "Mars",
    role: "Lesser Malefic",
    glyph: "♂",
    color: "#D32F2F",
    desc: "Mars is the contractor. He tears down walls, forces renovations, and sends bills you didn't see coming. As the Lesser Malefic, he creates friction — arguments, impulsive decisions, accidents, confrontations. But this is not cruelty; it's clearing. The territory Mars burns through is the territory that was already dead. Energy concentrated here builds the capacity for decisive, independent action.",
  }
];

export default function MaleficBeneficLessonPage() {
  const lesson = getLesson("malefic-benefic");

  return (
    <LessonShell lessonId="malefic-benefic">
      <GuideHeader
        guide={lesson}
        title="Benefics &"
        titleItalic="Malefics"
        lede="Every planet in your chart belongs to one of two camps. The Benefics move through your chart like good weather: warmth, ease, and open doors. The Malefics move through like a contractor: tearing down walls, forcing upgrades, and sending bills you didn't see coming. You need both. The contractor is expensive, but you also need a roof."
      />

      <ProseSection id="s01" kicker="§ 01" title="The Hellenistic Split">
        <p>
          Modern astrology often attempts to soften the edges of the practice, insisting that every planetary placement is equally "good." Traditional Hellenistic astrology does not. It recognizes a fundamental divide in the nature of planetary forces: some planets naturally stabilize and construct (the Benefics), while others naturally disrupt and dismantle (the Malefics).
        </p>
        <p>
          This is not a moral judgment. A <GlossaryTerm term="Malefic">Malefic</GlossaryTerm> planet is not "evil"—it simply represents the necessary friction required for growth. A <GlossaryTerm term="Benefic">Benefic</GlossaryTerm> planet is not "good"—it represents ease, and too much ease leads to stagnation. A chart needs the equilibrium of both forces to produce a functional human life.
        </p>
      </ProseSection>

      <ProseSection id="s02" kicker="§ 02" title="The Four Primary Forces">
        <ConceptStack layout="grid">
          {PLANETS.map((p) => (
            <ConceptCard
              key={p.id}
              badge={
                <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{p.glyph}</span>
              }
              title={p.name}
              kicker={p.role}
              tradition="hellenistic"
            >
              {p.desc}
            </ConceptCard>
          ))}
        </ConceptStack>
      </ProseSection>

      <PullQuote attribution="— Astro-Nat">
        The friction of the Malefics is the forge that makes the blessings of the Benefics meaningful.
      </PullQuote>

      <RelatedGuides
        label="Read next"
        guides={getGuides(["astrocartography", "geodetic-astrology"])}
      />
    </LessonShell>
  );
}
