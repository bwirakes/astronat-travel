import {
  LessonShell,
  LessonIntro,
  ConceptZero,
  ConceptStack,
  ConceptCard,
  Recap,
  SourcesPanel,
  PaginationCard,
  TraditionChip,
  SourceLine,
  Aside,
  getNext,
} from "../_components";

export default function StartHerePage() {
  const next = getNext("start");

  return (
    <LessonShell lessonId="start">
      <LessonIntro
        eyebrow="Orientation"
        title={["Start", "Here"]}
        italicLine={1}
        lede="Before any signs, planets, or charts: a short orientation. What astrology is, what it isn't, and how to read this Academy."
        objectives={[
          "Tell astronomy and astrology apart — and understand why both matter here.",
          "Recognize the three traditions this curriculum draws from.",
          "Know how a lesson is structured and where to find the glossary.",
        ]}
        scrollCue
      />

      <ConceptZero>
        Astronomy measures the sky. Astrology assigns meaning to that
        measurement. They share a vocabulary because, two millennia ago, they
        were the same craft. They are no longer the same craft, and an honest
        curriculum keeps them straight.
      </ConceptZero>

      <ConceptStack layout="single">
        <ConceptCard
          kicker="The split"
          title="Astronomy vs. Astrology"
          tradition="astronomy"
          watermark="✦"
          meta={[
            { label: "Method", value: "Measurement" },
            { label: "Falsifiable", value: "Yes" },
          ]}
        >
          <p>
            <strong className="opacity-100">Astronomy</strong> is the science
            of where things are in the sky and how they move. It is measurable,
            predictive, and falsifiable. When this Academy talks about the
            ecliptic, longitude, eclipses, the lunar cycle, or the orbits of
            planets, it speaks in astronomy voice — declarative, sourced,
            literally true.
          </p>
          <p>
            <strong className="opacity-100">Astrology</strong> is the human
            practice of assigning meaning to those positions and movements. It
            is interpretive, traditional, and not falsifiable in the scientific
            sense. When this Academy talks about what a planet &ldquo;rules,&rdquo; what a
            sign &ldquo;expresses,&rdquo; or how a transit &ldquo;feels,&rdquo; it speaks in astrology
            voice — attributed to a tradition, never to &ldquo;the cosmos.&rdquo;
          </p>
          <p className="opacity-90">
            Both are useful. They are not the same kind of claim, and we never
            let one wear the other&apos;s clothing.
          </p>
        </ConceptCard>

        <ConceptCard
          kicker="Tradition"
          title="Hellenistic"
          tradition="hellenistic"
          watermark="α"
          meta={[
            { label: "Era", value: "~100 BCE – 700 CE" },
            { label: "Region", value: "Mediterranean" },
          ]}
        >
          <p>
            The classical Western lineage. The terms <em>benefic</em>,{" "}
            <em>malefic</em>, <em>domicile</em>, <em>exaltation</em>,{" "}
            <em>aspect</em>, and the seven traditional planets all come from
            here. When you see a Hellenistic chip in this Academy, the claim is
            from this tradition.
          </p>
          <p>
            <SourceLine author="Brennan, Chris" year={2017}>
              The most thorough modern reconstruction is in
            </SourceLine>{" "}
            We rely on it for vocabulary and for distinguishing what&apos;s
            classical from what&apos;s modern.
          </p>
        </ConceptCard>

        <ConceptCard
          kicker="Tradition"
          title="Modern Western"
          tradition="modern"
          watermark="β"
          meta={[
            { label: "Era", value: "~1900 – present" },
            { label: "Lens", value: "Psychological" },
          ]}
        >
          <p>
            The 20th-century reframing. Adds the outer planets (Uranus,
            Neptune, Pluto), reinterprets traditional planets in psychological
            terms, and treats the chart as a map of inner life rather than
            external fate. Modern astrology is what most readers encounter
            first — it&apos;s the language of horoscopes, books, and most apps.
          </p>
          <p>
            We keep it for its clarity around inner experience, while
            preserving the older tradition for technique.
          </p>
        </ConceptCard>

        <ConceptCard
          kicker="Tradition"
          title="Mundane"
          tradition="mundane"
          watermark="γ"
          meta={[
            { label: "Subject", value: "Cities, Nations, Events" },
            { label: "Includes", value: "Geodetic" },
          ]}
        >
          <p>
            The branch concerned with the world rather than the individual:
            charts of countries, cities, eclipses, and historical events. The
            Astrocartography and Geodetic Astrology lessons (Module 3) are
            mundane in flavor.
          </p>
          <p>
            <SourceLine author="Campion, Nick" year={1988}>
              The reference work in this corner is
            </SourceLine>
          </p>
        </ConceptCard>

        <ConceptCard
          kicker="How to read"
          title="A Lesson Has 3 Acts"
          watermark="·"
        >
          <p>
            Every Academy lesson is built the same way:
          </p>
          <ol className="space-y-2 list-decimal list-inside opacity-90 mt-2">
            <li>
              <strong className="opacity-100">Intro</strong> — orientation,
              learning objectives, prerequisites.
            </li>
            <li>
              <strong className="opacity-100">Teach</strong> — one concept-zero
              anchor, one teaching artifact (a wheel, a map, a diagram), a
              sequence of concept cards, and a worked example.
            </li>
            <li>
              <strong className="opacity-100">Next</strong> — sources,
              glossary, and the bridge into the next lesson.
            </li>
          </ol>
          <Aside label="Glossary">
            Every defined term — <em>ecliptic, ascendant, domicile, aspect,
            transit</em> — is linked to a single glossary page. Hover any
            dotted-underlined term to see its definition; click to jump to the
            full entry.
          </Aside>
        </ConceptCard>

        <ConceptCard
          kicker="Tradition tags"
          title="Where Each Claim Comes From"
          watermark="◇"
        >
          <p>
            Every concept card in this Academy carries a tradition chip in its
            top-right corner. The four chips look like this:
          </p>
          <div className="flex flex-wrap gap-3 my-4">
            <TraditionChip tradition="hellenistic" />
            <TraditionChip tradition="modern" />
            <TraditionChip tradition="mundane" />
            <TraditionChip tradition="astronomy" />
          </div>
          <p>
            If you ever wonder <em>&ldquo;who says so?&rdquo;</em>, the chip is the answer.
            Astronomy chips mean &ldquo;this is measurable fact.&rdquo; The other three
            mean &ldquo;this is a coherent symbolic system from this lineage&rdquo; — not
            &ldquo;this is empirically true.&rdquo;
          </p>
        </ConceptCard>

        <ConceptCard
          kicker="Honesty"
          title="What Astrology Cannot Do"
          watermark="!"
        >
          <p>
            Astrology will not predict lottery numbers, diagnose illness, or
            replace therapy. It is not a substitute for medical, legal, or
            financial advice, and we will not pretend otherwise.
          </p>
          <p>
            What it can do is give you a vocabulary for self-observation that
            has been refined for two thousand years. If you learn it the way
            this Academy teaches it — with traditions named and astronomy kept
            literal — you&apos;ll find a system useful for noticing patterns in
            your own life. That is what we promise. Nothing more.
          </p>
        </ConceptCard>
      </ConceptStack>

      <Recap
        items={[
          "Astronomy measures the sky; astrology assigns meaning. We never conflate the two.",
          "Three traditions feed this curriculum: Hellenistic (classical), Modern Western (psychological), Mundane (place and world).",
          "Every lesson follows a 3-act structure with a glossary, tradition chips, and named sources.",
        ]}
      />

      <SourcesPanel
        sources={[
          {
            author: "Brennan, Chris",
            title: "Hellenistic Astrology: The Study of Fate and Fortune",
            year: 2017,
            note: "The standard modern reconstruction of the classical lineage.",
          },
          {
            author: "Campion, Nick",
            title: "The Book of World Horoscopes",
            year: 1988,
            note: "The reference for mundane astrology and national charts.",
          },
          {
            author: "Greene, Liz",
            title: "Saturn: A New Look at an Old Devil",
            year: 1976,
            note: "A clear example of the modern psychological reframing.",
          },
        ]}
      />

      <PaginationCard
        prev={null}
        next={next}
        bridge={
          next?.bridge ??
          "Begin with what's overhead. The astronomy under every astrological claim."
        }
      />
    </LessonShell>
  );
}
