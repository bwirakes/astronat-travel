import {
  LessonShell,
  GuideHeader,
  ProseSection,
  RelatedGuides,
  SourcesPanel,
  Aside,
  getLesson,
  getGuides,
} from "../_components";

export const revalidate = 3600;

/**
 * The welcome letter. Sits above the Astro 101 and Guides shelves on the
 * hub — not a "Lesson 0" any more. Astro-Nat voice essay (~600 words) on
 * what this hub is, the line between astronomy and astrology, the three
 * traditions you'll see cited, and the contract about what astrology can
 * and cannot do.
 */
export default function WelcomeLetterPage() {
  const guide = getLesson("start");
  const related = getGuides(["zodiac", "houses", "aspects"]);

  return (
    <LessonShell lessonId="start">
      <GuideHeader
        guide={guide}
        title="Start"
        titleItalic="Here"
        byline="By Astro-Nat · Astrocartographer"
        lede="If you came here looking for your weekly horoscope, this is not that website. This is a working library of how astrology actually works — what it measures, what it interprets, and where the line between the two sits. Read this first only if you want to know what you&rsquo;re looking at before you start clicking around."
      />

      <ProseSection>
        <h3 id="s01">§ 01 · What this hub is</h3>
        <p>
          A library of guides, not a course. There is no Lesson 02 of 09,
          no quiz at the end, no certificate. Each guide stands on its own.
          Pick the one whose title catches you, or take the curated{" "}
          <em>Start Here</em> path on the index if you want a recommended
          order. The hub has two shelves. <strong>Astro 101</strong> is the
          foundation — the four guides every chart reading sits on.{" "}
          <strong>Guides</strong> is everything else: techniques, applied
          astrology, the practical stuff. Read the foundations first if
          you&rsquo;re new. Otherwise, follow your curiosity.
        </p>

        <h3 id="s02">§ 02 · The line we never cross</h3>
        <p>
          Astronomy measures the sky. Astrology assigns meaning to that
          measurement. They share a vocabulary because, two millennia ago,
          they were the same craft. They are no longer the same craft, and
          this hub keeps them straight. When a guide says the Sun is at
          278° of ecliptic longitude, that is astronomy — measurable,
          predictive, falsifiable. When a guide says Saturn in the 10th
          house rewards earned authority, that is astrology — interpretive,
          traditional, attributed to a lineage. Both are useful. They are
          not the same kind of claim, and we never let one wear the
          other&rsquo;s clothing.
        </p>
        <p>
          What you can expect from us: declarative voice when we&rsquo;re
          stating astronomical fact, attributed voice when we&rsquo;re citing
          a tradition, and a named source on every page. What you should
          push back on, anywhere on the internet: anyone who tells you
          astrology &ldquo;is&rdquo; or &ldquo;isn&rsquo;t&rdquo; true without
          first telling you which tradition they&rsquo;re standing on.
        </p>

        <h3 id="s03">§ 03 · The three traditions you&rsquo;ll see cited</h3>
        <p>
          <strong>Hellenistic</strong> (~100 BCE – 700 CE, Mediterranean)
          is the classical Western lineage. The terms <em>benefic</em>,{" "}
          <em>malefic</em>, <em>domicile</em>, <em>exaltation</em>, and{" "}
          <em>aspect</em> all come from here — along with most of the
          working technique. The standard modern reconstruction is Chris
          Brennan&rsquo;s <em>Hellenistic Astrology</em> (2017); we lean on it
          for vocabulary and for telling classical claims from modern ones.
        </p>
        <p>
          <strong>Modern Western</strong> (~1900 – present) is the
          twentieth-century reframing. It adds the outer planets (Uranus,
          Neptune, Pluto), reads traditional planets in psychological
          terms, and treats the chart as a map of inner life rather than
          external fate. This is what most readers encounter first — it is
          the language of horoscope columns, books, and most apps. Liz
          Greene&rsquo;s <em>Saturn: A New Look at an Old Devil</em> (1976) is
          a clean example.
        </p>
        <p>
          <strong>Mundane</strong> astrology is the branch concerned with
          the world rather than the individual: charts of countries,
          cities, eclipses, and historical events. The Astrocartography
          and Geodetic Astrology guides on this hub are mundane in flavor.
          Nick Campion&rsquo;s <em>Book of World Horoscopes</em> (1988) is the
          reference work in this corner.
        </p>
        <Aside label="What the labels mean">
          When a guide cites a claim from one of these lineages, we name
          the lineage. When we cite a measurable fact, we cite the math or
          the astronomer. If a guide ever sounds like &ldquo;the cosmos
          says&rdquo; or &ldquo;the universe wants&rdquo; without a tradition
          attached, we&rsquo;ve made a mistake — flag it.
        </Aside>

        <h3 id="s04">§ 04 · What this hub does and does not promise</h3>
        <p>
          Astrology will not predict lottery numbers, diagnose illness, or
          replace therapy. It is not a substitute for medical, legal, or
          financial advice, and we will not pretend otherwise. If a guide
          here ever drifts into that territory, you should stop reading
          and find a doctor, lawyer, or accountant.
        </p>
        <p>
          What this hub will give you is a vocabulary for self-observation
          that has been sharpened for two thousand years. Read the
          foundations on the 101 shelf and you&rsquo;ll be able to read your
          own chart — not flawlessly, but honestly. Read the guides
          shelf and you&rsquo;ll have technique on top of vocabulary. That is
          the contract. Nothing more.
        </p>
      </ProseSection>

      <SourcesPanel
        sources={[
          {
            author: "Brennan, Chris",
            title: "Hellenistic Astrology: The Study of Fate and Fortune",
            year: 2017,
            note: "The standard modern reconstruction of the classical lineage.",
          },
          {
            author: "Greene, Liz",
            title: "Saturn: A New Look at an Old Devil",
            year: 1976,
            note: "A clear example of the modern psychological reframing.",
          },
          {
            author: "Campion, Nick",
            title: "The Book of World Horoscopes",
            year: 1988,
            note: "The reference for mundane astrology and national charts.",
          },
        ]}
      />

      <RelatedGuides label="Start with these" guides={related} />
    </LessonShell>
  );
}
