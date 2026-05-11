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
  ConceptCard,
  ConceptStack,
  getLesson,
  getGuides,
} from "../_components";

// ═══════════════════════════════════════════════════════════════
// ASPECT DATA
// ═══════════════════════════════════════════════════════════════

const ASPECTS = [
  {
    id: "conjunction",
    name: "Conjunction",
    angle: "0°",
    desc: "When two planets occupy the same degree of the zodiac, they fuse. There's no separation between their energies — no distance to negotiate. This is the most intense of all aspects: amplified, undiluted, and impossible to ignore. A conjunction can be your greatest gift or your biggest blind spot, depending entirely on which planets are merged.",
    color: "#0456fb",
  },
  {
    id: "sextile",
    name: "Sextile",
    angle: "60°",
    desc: "The sextile is the aspect of the open door. At 60°, planets are compatible and conversational — they help each other without drama. But unlike the trine, this ease isn't automatic. The sextile requires you to notice the opportunity and walk through the door. It rewards conscious effort with disproportionate results.",
    color: "#CAF1F0",
  },
  {
    id: "square",
    name: "Square",
    angle: "90°",
    desc: "The square is the aspect that builds character. At 90°, two planets are in permanent tension — they want incompatible things, and they don't compromise easily. This isn't abstract friction: you feel it as frustration, impasse, and the sense that one part of you is constantly blocking another. But every significant achievement in a chart can usually be traced to a well-worked square.",
    color: "#E67A7A",
  },
  {
    id: "trine",
    name: "Trine",
    angle: "120°",
    desc: "The trine is the aspect everyone wants — and sometimes the most dangerous one to have. At 120°, energy flows between planets with zero friction. Gifts arrive naturally. Talent feels inherited, not earned. But because nothing pushes back, these abilities are often left undeveloped — taken for granted until a square or opposition forces the question: are you actually using this? Every trine is a potential waiting to be deliberately chosen.",
    color: "#00FD00",
  },
  {
    id: "opposition",
    name: "Opposition",
    angle: "180°",
    desc: "The opposition is a tug-of-war. At 180°, two planets sit directly across the chart from each other, and each one pulls in the opposite direction. You feel it as projection — attributing one side of the tension to other people, or to circumstances, rather than recognizing it as an internal split. Integration is the only resolution: not choosing one side over the other, but learning to carry both at once.",
    color: "#888888",
  }
];

export default function AspectsLessonPage() {
  const lesson = getLesson("aspects");

  return (
    <LessonShell lessonId="aspects">
      <GuideHeader
        guide={lesson}
        title="Planetary"
        titleItalic="Aspects"
        lede="Imagine two people in a room. Whether they collaborate, compete, or ignore each other entirely depends not on who they are, but on how they are positioned. Aspects work the same way. They are the geometric angles between planets in your chart, determining whether your inner forces work together or against each other."
      />

      <ProseSection id="s01" kicker="§ 01" title="Sacred Geometry">
        <p>
          A chart without aspects is silent. The angles provide the tension and flow that make human life dynamic. When two planets sit at specific geometric angles to each other (like 90° or 120°), they form an aspect. They are locked in a permanent conversation. 
        </p>

        <Plate number="01" title="The Aspect Web">
          <NatalWheel accent="var(--color-acqua)" showPlanets={false} showAspects={true} />
        </Plate>
      </ProseSection>

      <ProseSection id="hard-vs-soft" kicker="§ 02" title="Hard vs. Soft Aspects">
        <p>
          Astrology categorizes aspects into two main camps: <strong>hard</strong> (squares and oppositions) and <strong>soft</strong> (trines and sextiles). Soft aspects represent flow, ease, and natural talent. Hard aspects represent friction, tension, and necessary growth. 
        </p>
        <p>
          Do not make the mistake of thinking "soft" means "good" and "hard" means "bad." A chart with only soft aspects is a life that lacks the tension required to achieve anything of substance. The squares and oppositions are what get you out of bed in the morning.
        </p>
      </ProseSection>

      <ProseSection id="s03" kicker="§ 03" title="The Five Major Aspects">
        <ConceptStack layout="grid">
          {ASPECTS.map((a) => (
            <ConceptCard
              key={a.id}
              badge={a.angle}
              title={a.name}
              kicker="Major Aspect"
            >
              {a.desc}
            </ConceptCard>
          ))}
        </ConceptStack>
      </ProseSection>

      <PullQuote attribution="— Astro-Nat">
        Integration is the only resolution: not choosing one side over the other, but learning to carry both at once.
      </PullQuote>

      <RelatedGuides
        label="Read next"
        guides={getGuides(["natal-chart", "malefic-benefic", "astrocartography"])}
      />
    </LessonShell>
  );
}
