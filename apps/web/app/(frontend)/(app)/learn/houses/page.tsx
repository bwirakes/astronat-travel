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
  GlossaryTerm,
  getLesson,
  getGuides,
} from "../_components";
import SignIcon from "@/app/components/SignIcon";

// ═══════════════════════════════════════════════════════════════
// HOUSES DATA
// ═══════════════════════════════════════════════════════════════

const HOUSES_DATA = [
  {
    id: 1,
    name: "I",
    keyword: "Identity",
    ruling: "Self · Physical Body · First Impressions",
    desc: "The mask you wear when you walk into a room — your body, your brand, your first move. This is the house of beginnings and raw energy you lead with.",
    naturalSign: "Aries",
    naturalRuler: "Mars",
    rulerGlyph: "♂",
  },
  {
    id: 2,
    name: "II",
    keyword: "Values",
    ruling: "Money · Possessions · Self-Worth",
    desc: "What you own, what you earn, and more crucially — what you believe you deserve. Security is built here, one brick at a time.",
    naturalSign: "Taurus",
    naturalRuler: "Venus",
    rulerGlyph: "♀",
  },
  {
    id: 3,
    name: "III",
    keyword: "Mind",
    ruling: "Siblings · Short Travel · Communication",
    desc: "The chattering monkey: your siblings, your neighborhood, your texts and your commute. The mind runs the local circuits of daily life.",
    naturalSign: "Gemini",
    naturalRuler: "Mercury",
    rulerGlyph: "☿",
  },
  {
    id: 4,
    name: "IV",
    keyword: "Home",
    ruling: "Roots · Family · Mother · Private Life",
    desc: "The emotional bedrock. Your roots, your parents, the private face nobody else sees. This is what you carry when everything else is stripped away.",
    naturalSign: "Cancer",
    naturalRuler: "Moon",
    rulerGlyph: "☽",
  },
  {
    id: 5,
    name: "V",
    keyword: "Joy",
    ruling: "Creativity · Romance · Children · Pleasure",
    desc: "Pleasure for pleasure's sake. Love affairs, art, children, gambling, the sheer drama of being alive. Here you play.",
    naturalSign: "Leo",
    naturalRuler: "Sun",
    rulerGlyph: "☉",
  },
  {
    id: 6,
    name: "VI",
    keyword: "Duty",
    ruling: "Health · Daily Routine · Service · Pets",
    desc: "The unglamorous engine: your health rituals, your work ethic, the to-do list. Mastery lives in the unglamorous details perfected over time.",
    naturalSign: "Virgo",
    naturalRuler: "Mercury",
    rulerGlyph: "☿",
  },
  {
    id: 7,
    name: "VII",
    keyword: "Others",
    ruling: "Marriage · Partnerships · Open Enemies",
    desc: "The mirror. Your long-term partners and your open rivals — those who complete or oppose you. What you seek in others, you lack in yourself.",
    naturalSign: "Libra",
    naturalRuler: "Venus",
    rulerGlyph: "♀",
  },
  {
    id: 8,
    name: "VIII",
    keyword: "Death",
    ruling: "Sex · Transformation · Shared Resources",
    desc: "Sex, inheritance, taxes, obsession, rebirth. The territory you must cross to transform. Nothing returns from the 8th house unchanged.",
    naturalSign: "Scorpio",
    naturalRuler: "Pluto",
    rulerGlyph: "♇",
  },
  {
    id: 9,
    name: "IX",
    keyword: "Wisdom",
    ruling: "Higher Education · Long Travel · Religion",
    desc: "The horizon expander: foreign lands, higher philosophy, publishing, the search for meaning. Belief systems and the stories we live by.",
    naturalSign: "Sagittarius",
    naturalRuler: "Jupiter",
    rulerGlyph: "♃",
  },
  {
    id: 10,
    name: "X",
    keyword: "Stature",
    ruling: "Career · Public Life · Father · Legacy",
    desc: "The summit. Your career, your public reputation, your legacy — what history will record. The world watches this house.",
    naturalSign: "Capricorn",
    naturalRuler: "Saturn",
    rulerGlyph: "♄",
  },
  {
    id: 11,
    name: "XI",
    keyword: "Community",
    ruling: "Friends · Hopes · Social Systems",
    desc: "Your tribe, your dreams, your network. The future you're building alongside others. Progress lives here — collective, collaborative, radical.",
    naturalSign: "Aquarius",
    naturalRuler: "Uranus",
    rulerGlyph: "♅",
  },
  {
    id: 12,
    name: "XII",
    keyword: "Solitude",
    ruling: "Hidden Things · Dreams · Institutions",
    desc: "The blind spot. Retreat, dreams, institutions, and the karma you carry but cannot see. The well from which unconscious forces draw.",
    naturalSign: "Pisces",
    naturalRuler: "Neptune",
    rulerGlyph: "♆",
  },
];

export default function HousesLessonPage() {
  const lesson = getLesson("houses");

  return (
    <LessonShell lessonId="houses">
      <GuideHeader
        guide={lesson}
        title="The 12"
        titleItalic="Houses"
        lede="While signs dictate how a planet behaves, the 12 houses tell you exactly where that energy will manifest in your life. They divide the physical sky surrounding you into 12 distinct arenas — from your immediate physical body (House 1) to the deep unconscious (House 12). If signs are the adjectives, houses are the nouns."
      />

      <ProseSection id="s01" kicker="§ 01" title="Physical Geometry">
        <p>
          Unlike the zodiac, which is a wheel of stars far out in space, the houses are anchored to the Earth. The line separating House 1 and House 12 is the eastern horizon at the exact moment of your birth. The line at the very top of the chart separating House 9 and House 10 is the highest point the sun reached that day. 
        </p>

        <Plate number="01" title="The 12 Houses">
          <NatalWheel accent="var(--sage)" showPlanets={false} showAspects={false} mode="houses" />
        </Plate>
      </ProseSection>

      <ProseSection id="s02" kicker="§ 02" title="The Mechanics">
        <p>
          An empty house is not a dead house. Just because there are no planets sitting in your 7th House of Relationships or your 2nd House of Finances does not mean you are destined to die alone or broke. 
        </p>
        <p>
          Think of an empty house like an empty room in an apartment. The room still exists, and you still use it. To understand what happens in that room, you must look at the <em>landlord</em> of the room. In astrology, the landlord is the ruling <GlossaryTerm term="Planet">planet</GlossaryTerm> of the sign on the cusp of that house. If the landlord is in a strong position, the affairs of that house run smoothly. If the landlord is struggling, there is a leak in the ceiling of that house that you will have to deal with—even if the room is empty.
        </p>
      </ProseSection>

      <ProseSection id="s03" kicker="§ 03" title="The Twelve Arenas">
        <ConceptStack layout="grid">
          {HOUSES_DATA.map((h) => (
            <ConceptCard
              key={h.id}
              badge={h.name}
              title={`House ${h.id}`}
              kicker={h.keyword}
              subtitle={h.ruling}
              meta={[
                {
                  label: "Natural Sign",
                  value: (
                    <span className="flex items-center gap-1.5">
                      <SignIcon sign={h.naturalSign} size={12} color="currentColor" />
                      {h.naturalSign}
                    </span>
                  ),
                },
                {
                  label: "Natural Ruler",
                  value: (
                    <span className="flex items-center gap-1.5">
                      <span style={{ fontSize: "12px", lineHeight: 1 }}>{h.rulerGlyph}</span>
                      {h.naturalRuler}
                    </span>
                  ),
                },
              ]}
            >
              {h.desc}
            </ConceptCard>
          ))}
        </ConceptStack>
      </ProseSection>

      <PullQuote attribution="— Astro-Nat">
        Every chart has 12 houses. Some are active and full of planets, while others are silent stages waiting for transits to pass through and activate them.
      </PullQuote>

      <RelatedGuides
        label="Read next"
        guides={getGuides(["aspects", "natal-chart", "malefic-benefic"])}
      />
    </LessonShell>
  );
}
