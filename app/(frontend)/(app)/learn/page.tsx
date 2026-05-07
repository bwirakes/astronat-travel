import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SignIcon from "@/app/components/SignIcon";
import { PageHeader } from "@/components/app/page-header-context";
import {
  GuideButton,
  type GuideButtonVariant,
  getLesson,
  type LessonId,
} from "./_components";

/**
 * The Astronat Hub. One compact hero, two shelves of editorial buttons:
 * **Astro 101 — Start Here** (4 numbered cards in path order; this is the
 * curated reading list AND the foundations shelf, collapsed into one) and
 * **Guides** (5 applied / techniques cards). No tinted wrapper panels,
 * no two-line bridges — each button is its own typographic lockup
 * lifted from `app/components/ExploreButtons.tsx`.
 */

type GuideContent = {
  id: LessonId;
  variant: GuideButtonVariant;
  kicker: string;
  /** Optional top-right counter — used as the big serif "01 / 04" on the
   *  Start Here cards. */
  counter?: string;
  script?: string;
  main: string;
  sub: string;
  decoration?: React.ReactNode;
};

/* ── 101 — Start Here (in path order) ─────────────────────────────────── */
const ASTRO_101: GuideContent[] = [
  {
    id: "zodiac",
    variant: "signs",
    kicker: "01 · START HERE",
    counter: "01 / 04",
    script: "Twelve",
    main: "Zodiac",
    sub: "Coordinates, not personalities.",
    decoration: <SignIcon sign="Aries" size={56} />,
  },
  {
    id: "houses",
    variant: "chart",
    kicker: "02 · CHART",
    counter: "02 / 04",
    script: "Twelve",
    main: "Houses",
    sub: "Sectors of life. Where the work happens.",
  },
  {
    id: "aspects",
    variant: "chartDark",
    kicker: "03 · CHART",
    counter: "03 / 04",
    script: "Geometry",
    main: "Aspects",
    sub: "How planets talk across the chart.",
  },
  {
    id: "natal-chart",
    variant: "welcome",
    kicker: "04 · SYNTHESIS",
    counter: "04 / 04",
    script: "Your",
    main: "Chart",
    sub: "The synthesis — everything else lands here.",
  },
];

/* ── Guides — techniques + applied ────────────────────────────────────── */
const GUIDES: GuideContent[] = [
  {
    id: "viewing-the-stars",
    variant: "practice",
    kicker: "PRACTICE",
    script: "the stars",
    main: "Viewing",
    sub: "Where the planets are tonight.",
  },
  {
    id: "constellations",
    variant: "sky",
    kicker: "SKY",
    script: "actual",
    main: "Constellations",
    sub: "The drift, in full.",
  },
  {
    id: "malefic-benefic",
    variant: "tradition",
    kicker: "TRADITION",
    script: "& benefics",
    main: "Malefics",
    sub: "Not all planets are nice.",
  },
  {
    id: "astrocartography",
    variant: "relocation",
    kicker: "RELOCATION",
    script: "carto",
    main: "Astro",
    sub: "Your chart on the map.",
  },
  {
    id: "geodetic-astrology",
    variant: "chart",
    kicker: "RELOCATION",
    script: "places",
    main: "Geodetic",
    sub: "Cities have weather too.",
  },
];

export default function LearnHubPage() {
  const welcome = getLesson("start");

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-body pb-24 md:pb-32 overflow-x-hidden">
      <PageHeader title="Astronat Hub" />

      {/* ─── Hero — tight, single-stance ──────────────────────────────── */}
      <section className="px-6 md:px-12 lg:px-20 pt-10 md:pt-16 pb-8 md:pb-12 max-w-[1600px] mx-auto">
        <div className="max-w-3xl">
          <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-70">
            The Astronat Hub
          </span>
          <h1 className="mt-4 md:mt-6 font-primary text-[clamp(2rem,3.6vw,3rem)] leading-[1.05] tracking-tight">
            How astrology{" "}
            <span
              className="italic"
              style={{ color: "var(--color-y2k-blue)" }}
            >
              actually works.
            </span>
          </h1>
          <p className="mt-5 md:mt-6 font-body text-base md:text-lg leading-[1.5] opacity-90 max-w-2xl">
            You don&rsquo;t need a horoscope. You need a vocabulary. Read in any
            order, or take the four-guide path below if you&rsquo;re starting from
            zero.
          </p>
          <div className="mt-5 md:mt-6">
            <Link
              href={welcome.href}
              className="group inline-flex items-baseline gap-2 font-mono text-[11px] md:text-xs uppercase tracking-[0.25em]"
              style={{ color: "var(--color-y2k-blue)" }}
            >
              Read the welcome letter
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Astro 101 — Start Here ──────────────────────────────────── */}
      <Shelf
        kicker="Astro 101 — Start Here"
        caption="The four foundations every chart reading sits on. Read in path order if you're new — or skip around."
        items={ASTRO_101}
        gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        useCounter
      />

      {/* ─── Guides — techniques + applied ───────────────────────────── */}
      <Shelf
        kicker="Guides"
        caption="Techniques and applied astrology. Read after the foundations, or whenever a topic catches you."
        items={GUIDES}
        gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      />
    </div>
  );
}

/**
 * One labelled shelf of GuideButtons. Generic so 101 + Guides share shape,
 * only the kicker / caption / item list / grid columns differ.
 */
function Shelf({
  kicker,
  caption,
  items,
  gridCols,
  useCounter = false,
}: {
  kicker: string;
  caption: string;
  items: GuideContent[];
  gridCols: string;
  useCounter?: boolean;
}) {
  return (
    <section className="px-6 md:px-12 lg:px-20 py-10 md:py-14 max-w-[1600px] mx-auto">
      {/* ─── Section header rule ─────────────────────────────────────── */}
      <div className="border-t border-[var(--surface-border)] pt-5 md:pt-6 mb-6 md:mb-10">
        <div className="grid md:grid-cols-12 gap-y-2 gap-x-10">
          <div className="md:col-span-4">
            <span className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] font-medium">
              {kicker}
            </span>
          </div>
          <div className="md:col-span-8">
            <p className="font-body text-sm md:text-base leading-[1.55] opacity-80 max-w-2xl">
              {caption}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Buttons grid ─────────────────────────────────────────────── */}
      <div className={`grid ${gridCols} gap-4 md:gap-5`}>
        {items.map((item) => {
          const guide = getLesson(item.id);
          return (
            <GuideButton
              key={item.id}
              href={guide.href}
              variant={item.variant}
              kicker={item.kicker}
              meta={useCounter ? item.counter : guide.readingTime.toUpperCase()}
              metaAsCounter={useCounter}
              script={item.script}
              main={item.main}
              sub={item.sub}
              decoration={item.decoration}
            />
          );
        })}
      </div>
    </section>
  );
}
