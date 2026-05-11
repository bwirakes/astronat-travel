"use client";

import React from "react";
import Image from "next/image";
import {
  LessonShell,
  GuideHeader,
  ProseSection,
  PullQuote,
  RelatedGuides,
  Plate,
  getLesson,
  getGuides,
} from "../_components";

export default function ViewingTheStarsLessonPage() {
  const lesson = getLesson("viewing-the-stars");

  return (
    <LessonShell lessonId="viewing-the-stars">
      <GuideHeader
        guide={lesson}
        title="Viewing the"
        titleItalic="Stars"
        lede="Astrology is not just a theoretical framework or a personality test—it is a live event happening above you right now. The clock is still ticking. Here is how to step out of the textbook and into the actual practice of reading the sky."
      />

      <ProseSection id="s01" kicker="§ 01" title="Practical Application">
        <p>
          The most common mistake new students make is treating astrology entirely as a static map—memorizing the definitions of the signs and the houses, and then stopping there. But the sky did not stop moving the day you were born. The planets are in continuous motion, and their current positions are interacting with your birth chart every day.
        </p>

        <Plate number="01" title="The Cosmic Weather">
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-[var(--shape-asymmetric-md)] overflow-hidden">
            <Image
              src="/moody-landscape.jpg"
              alt="Moody landscape showing the night sky"
              fill
              className="object-cover grayscale hover:grayscale-0 transition-all duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60" />
          </div>
        </Plate>
      </ProseSection>

      <ProseSection id="s02" kicker="§ 02" title="Track the Light">
        <p>
          <strong>1. Watch the Moon.</strong> The moon changes signs every 2.5 days. It is the fastest-moving pointer on the cosmic clock. Notice how your emotional "weather" shifts as the moon moves through the elements—from Fire (energy) to Earth (grounding) to Air (talkative) to Water (sensitive). This is the easiest way to feel astrology in your physical body.
        </p>
        <p>
          <strong>2. Learn Your Transits.</strong> A transit occurs when a planet currently in the sky passes over a degree occupied by a planet in your birth chart. These are the windows of opportunity and the portals for growth. When the transiting Sun crosses your natal Midheaven, you will be highly visible. When transiting Saturn squares your natal Moon, you will feel the emotional weight of responsibility.
        </p>
      </ProseSection>

      <ProseSection id="s03" kicker="§ 03" title="The Journey Continues">
        <p>
          You are now equipped with the first principles of the stars. You understand the signs, the planets, the houses, and the geometric aspects that bind them together. You know how to locate the angles, and you understand the difference between the physical constellations and the tropical zodiac.
        </p>
        <p>
          Go forth and read the heavens. Look at the charts of your friends, your family, and your enemies. The only way to learn this language is to speak it.
        </p>
      </ProseSection>

      <PullQuote attribution="— Astro-Nat">
        The chart is the map. The transits are the weather. You are the navigator.
      </PullQuote>

      <RelatedGuides
        label="Review Foundations"
        guides={getGuides(["zodiac", "constellations", "houses"])}
      />
    </LessonShell>
  );
}
