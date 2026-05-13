import SignIcon from "@/app/components/SignIcon";
import {
  LessonShell,
  GuideHeader,
  ProseSection,
  ConceptCard,
  ElementSection,
  SourcesPanel,
  RelatedGuides,
  Plate,
  KeyStrip,
  GlossaryTerm,
  getLesson,
  getGuides,
} from "../_components";

export const revalidate = 3600;

type Modality = "Cardinal" | "Fixed" | "Mutable";
type Element = "Fire" | "Earth" | "Air" | "Water";

type Sign = {
  name: string;
  dates: string;
  symbol: string;
  modality: Modality;
  element: Element;
  gift: string;
  shadow: string;
  desc: string;
};

const SIGNS: Sign[] = [
  {
    name: "Aries",
    dates: "Mar 21 — Apr 19",
    symbol: "♈",
    modality: "Cardinal",
    element: "Fire",
    gift: "Momentum",
    shadow: "Combativeness",
    desc:
      "Aries doesn't ask permission. It moves first and figures out the plan midway. The first sign of the zodiac, it carries the energy of pure beginning — the sprint before strategy, the spark before the fire. Aries people are rarely the ones who hesitate; the gift is momentum, the growth edge is learning that not everything needs to be a fight.",
  },
  {
    name: "Taurus",
    dates: "Apr 20 — May 20",
    symbol: "♉",
    modality: "Fixed",
    element: "Earth",
    gift: "Loyalty",
    shadow: "Stubbornness",
    desc:
      "Taurus builds slowly and keeps what it builds. Fixed earth: it holds its position the way a mountain holds its shape. This is the sign that understands that the finest things — food, beauty, trust, security — are not rushed. The shadow is stubbornness; the gift is loyalty so consistent it becomes a form of love.",
  },
  {
    name: "Gemini",
    dates: "May 21 — Jun 20",
    symbol: "♊",
    modality: "Mutable",
    element: "Air",
    gift: "Range of mind",
    shadow: "Distraction",
    desc:
      "Gemini processes the world through conversation, comparison, and the relentless accumulation of new angles on every question. There is no final Gemini opinion — only the latest, most interesting one. This is a sign of extraordinary range and flexibility of mind. The weakness is distraction; the gift is the ability to understand almost anyone.",
  },
  {
    name: "Cancer",
    dates: "Jun 21 — Jul 22",
    symbol: "♋",
    modality: "Cardinal",
    element: "Water",
    gift: "Fierce care",
    shadow: "Withdrawal",
    desc:
      "Cancer doesn't love casually. When this sign commits — to a person, a place, a memory — it holds on with both hands. Cardinal water: it initiates through feeling, moves toward what needs protecting. The shell is real, and it exists for a reason. Getting past it is a privilege. Inside is a fierceness of care that most people only encounter once.",
  },
  {
    name: "Leo",
    dates: "Jul 23 — Aug 22",
    symbol: "♌",
    modality: "Fixed",
    element: "Fire",
    gift: "Generous visibility",
    shadow: "Self-spotlight",
    desc:
      "Leo needs to be seen, and there is nothing shallow about that need. It is the sign of the creative self — the part of the psyche that requires an audience not out of vanity, but because expression is how it confirms it exists. At its best, Leo's visibility is generous: it shines light on everyone nearby. At its lowest, it's a spotlight held only inward.",
  },
  {
    name: "Virgo",
    dates: "Aug 23 — Sep 22",
    symbol: "♍",
    modality: "Mutable",
    element: "Earth",
    gift: "Lasting craft",
    shadow: "Perfectionism",
    desc:
      "Virgo sees what's wrong. Not because it's negative, but because its mind is calibrated to precision — the variable that doesn't fit, the detail that undermines the whole. This is the sign of mastery through iteration: getting it right, then getting it more right. The trap is perfectionism that prevents completion; the gift is work that lasts because it was done correctly.",
  },
  {
    name: "Libra",
    dates: "Sep 23 — Oct 22",
    symbol: "♎",
    modality: "Cardinal",
    element: "Air",
    gift: "Sense of order",
    shadow: "Indecision",
    desc:
      "Libra experiences injustice physically — imbalance is not just an idea but a wrongness in the body. This is the sign of justice, partnership, and the belief that there is a right way for things to be arranged. Libra moves toward beauty and harmony because beauty is not aesthetic luxury but evidence that things are in their proper order.",
  },
  {
    name: "Scorpio",
    dates: "Oct 23 — Nov 21",
    symbol: "♏",
    modality: "Fixed",
    element: "Water",
    gift: "Depth perception",
    shadow: "Long memory",
    desc:
      "Scorpio does not do the surface. It finds the thing beneath the thing — the wound under the story, the motive behind the gesture. Fixed water: it holds its emotional charge the way a deep lake holds cold. Scorpio doesn't forgive easily, but it doesn't forget either. That memory is how it protects the people it decides to love.",
  },
  {
    name: "Sagittarius",
    dates: "Nov 22 — Dec 21",
    symbol: "♐",
    modality: "Mutable",
    element: "Fire",
    gift: "Optimism",
    shadow: "Restlessness",
    desc:
      "Sagittarius is the sign of the horizon. It aims, it travels, it philosophizes — and then it aims again. This is the sign that genuinely believes things can be better, bigger, more meaningful than they are right now, and it moves toward that belief with unusual speed. The weakness is restlessness and the perpetual sense that the answer is one country further. The gift is the optimism that makes the search worthwhile.",
  },
  {
    name: "Capricorn",
    dates: "Dec 22 — Jan 19",
    symbol: "♑",
    modality: "Cardinal",
    element: "Earth",
    gift: "Earned authority",
    shadow: "Cold pragmatism",
    desc:
      "Capricorn doesn't sprint — it climbs. Cardinal earth: it initiates through structure, moves toward summit. The reputation of this sign as 'cold' or 'ambitious' misses what's actually there: a deep respect for what is real, what lasts, and what takes actual work to achieve. Capricorn is the sign of earned authority. Whatever it builds is built to outlast it.",
  },
  {
    name: "Aquarius",
    dates: "Jan 20 — Feb 18",
    symbol: "♒",
    modality: "Fixed",
    element: "Air",
    gift: "Vision of the new",
    shadow: "Detachment",
    desc:
      "Aquarius is the sign of the future that hasn't arrived yet. Fixed air: it holds ideas with the intensity others reserve for emotions. This is the sign that identifies the problem with the way things currently are, and refuses to stop identifying it until something changes. The weakness is detachment — loving humanity while struggling with specific humans. The gift is a vision of what's possible that others can't always see yet.",
  },
  {
    name: "Pisces",
    dates: "Feb 19 — Mar 20",
    symbol: "♓",
    modality: "Mutable",
    element: "Water",
    gift: "Boundaryless empathy",
    shadow: "Loss of self",
    desc:
      "Pisces absorbs. It takes in the emotional atmosphere of every room, every person, every piece of music — and it responds. The most permeable of the signs, Pisces has the unique capacity to genuinely understand perspectives that are nothing like its own, which makes it the most compassionate and the most susceptible to losing itself in the process. The practice is boundary. The gift is the ability to love without conditions.",
  },
];

const ELEMENTS: Element[] = ["Fire", "Earth", "Air", "Water"];
const MODALITIES: Modality[] = ["Cardinal", "Fixed", "Mutable"];

const MODALITY_DESC: Record<Modality, string> = {
  Cardinal: "initiates",
  Fixed: "sustains",
  Mutable: "adapts",
};

const ELEMENT_DESC: Record<Element, string> = {
  Fire: "action",
  Earth: "matter",
  Air: "mind",
  Water: "feeling",
};

/**
 * The four element-level chapter breaks that group the twelve sign cards.
 * Order matters — it sets the reader's pacing through the second half of
 * the lesson. Each caption is one editorial sentence in Astro-Nat voice:
 * a stance, not a description.
 */
const ELEMENT_GROUPS: { element: Element; caption: string }[] = [
  {
    element: "Fire",
    caption:
      "The signs that run on momentum and conviction. Fire moves first and asks questions later — and yes, that is how things start.",
  },
  {
    element: "Earth",
    caption:
      "The signs that take the real world seriously. Earth builds slowly, keeps what it builds, and is unimpressed by anything that cannot survive contact with reality.",
  },
  {
    element: "Air",
    caption:
      "The signs that live in language, ideas, and the spaces between people. Air does not trust a feeling until it can name it.",
  },
  {
    element: "Water",
    caption:
      "The signs of memory, depth, and emotional intelligence. Water feels first — and remembers far longer than anyone gives it credit for.",
  },
];

/**
 * The 3×4 grid of signs by modality × element. Cells carry only SignIcon +
 * name — definitions live in the KeyStrips below the figure, not crammed into
 * the headers. Sized to content (max-w via the Plate wrapper); centered.
 */
function ModalityMatrix() {
  const findSign = (mod: Modality, el: Element) =>
    SIGNS.find((s) => s.modality === mod && s.element === el)!;

  return (
    <Plate
      number={1}
      title="Twelve into one"
      caption="Twelve signs, organised by modality (rows) and element (columns)."
    >
      {/* ─── Desktop / tablet: 3×4 matrix ─────────────────────────────── */}
      <div className="hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--surface-border)]">
              <th className="p-5 align-bottom w-32 lg:w-44" />
              {ELEMENTS.map((e) => (
                <th
                  key={e}
                  className="p-5 align-bottom border-l border-[var(--surface-border)] font-primary text-lg lg:text-xl tracking-tight uppercase"
                >
                  <GlossaryTerm term={e.toLowerCase()}>{e}</GlossaryTerm>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODALITIES.map((m) => (
              <tr key={m} className="border-b border-[var(--surface-border)]">
                <th className="p-5 align-middle font-primary text-lg lg:text-xl tracking-tight uppercase">
                  <GlossaryTerm term={m.toLowerCase()}>{m}</GlossaryTerm>
                </th>
                {ELEMENTS.map((e) => {
                  const sign = findSign(m, e);
                  return (
                    <td
                      key={e}
                      className="p-5 align-middle border-l border-[var(--surface-border)]"
                    >
                      <div className="flex items-center gap-3">
                        <span style={{ color: "var(--lesson-accent)" }}>
                          <SignIcon sign={sign.name} size={28} />
                        </span>
                        <span className="font-primary text-base lg:text-lg tracking-tight uppercase">
                          {sign.name}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Mobile: grouped vertical layout ─────────────────────────── */}
      <div className="md:hidden divide-y divide-[var(--surface-border)] border-y border-[var(--surface-border)]">
        {MODALITIES.map((m) => (
          <div key={m} className="py-5">
            <div className="font-primary text-lg tracking-tight uppercase mb-4">
              <GlossaryTerm term={m.toLowerCase()}>{m}</GlossaryTerm>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {ELEMENTS.map((e) => {
                const sign = findSign(m, e);
                return (
                  <div key={e} className="flex items-center gap-3">
                    <span style={{ color: "var(--lesson-accent)" }}>
                      <SignIcon sign={sign.name} size={24} />
                    </span>
                    <div className="min-w-0">
                      <div className="font-primary text-sm tracking-tight uppercase truncate">
                        {sign.name}
                      </div>
                      <div className="font-mono text-[8px] uppercase tracking-widest opacity-50">
                        <GlossaryTerm term={e.toLowerCase()}>{e}</GlossaryTerm>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Keys — the definitions that used to crowd the headers ───── */}
      <div className="mt-10 md:mt-12">
        <KeyStrip
          label="Element"
          items={ELEMENTS.map((e) => ({ term: e, defn: ELEMENT_DESC[e] }))}
        />
        <KeyStrip
          label="Modality"
          items={MODALITIES.map((m) => ({ term: m, defn: MODALITY_DESC[m] }))}
        />
      </div>
    </Plate>
  );
}

/**
 * One sign card. Pulled out so the page can render two ConceptStacks
 * (split around the matrix) without duplicating prop wiring.
 */
function SignConceptCard({ sign }: { sign: Sign }) {
  return (
    <ConceptCard
      title={sign.name}
      subtitle={sign.dates}
      badge={<SignIcon sign={sign.name} size={36} />}
      watermark={<SignIcon sign={sign.name} size={320} />}
      meta={[
        {
          label: "Element",
          value: (
            <GlossaryTerm term={sign.element.toLowerCase()}>
              {sign.element}
            </GlossaryTerm>
          ),
        },
        {
          label: "Modality",
          value: (
            <GlossaryTerm term={sign.modality.toLowerCase()}>
              {sign.modality}
            </GlossaryTerm>
          ),
        },
        { label: "Gift", value: sign.gift },
        { label: "Shadow", value: sign.shadow },
      ]}
    >
      <p>{sign.desc}</p>
    </ConceptCard>
  );
}

export default function ZodiacLessonPage() {
  const lesson = getLesson("zodiac");

  return (
    <LessonShell lessonId="zodiac">
      <GuideHeader
        guide={lesson}
        title="The"
        titleItalic="Zodiac"
        byline="By Astro-Nat · Astrocartographer"
        lede="You&rsquo;ve been told you&rsquo;re a Pisces, a Capricorn, a Sagittarius — and chances are nobody told you what the words actually mean. The zodiac is not a personality test. It is a coordinate system: twelve 30° slices of the sky used by every working astrologer for two thousand years, and the foundation every other lesson in this Academy stands on."
      />

      <ProseSection
        id="s01"
        kicker="§ 01"
        title="The system in one breath"
      >
        <p>
          If you know your sign and not much else, you are holding the
          smallest piece of a system that maps the entire sky. Here is the
          system. Three hundred and sixty degrees of the orbit Earth shares
          with the Sun — the{" "}
          <GlossaryTerm
            term="ecliptic"
            definition="The plane of Earth's orbit around the Sun, projected onto the sky. The Sun, Moon, and planets all appear to move along this line."
          >
            ecliptic
          </GlossaryTerm>
          {" "}— divided into twelve equal 30° sectors. Each sector is a sign.
          A sign is a coordinate, the way <em>longitude 47.3°</em> is a
          coordinate. It is not a personality. It is not a horoscope. It is
          not a description of what the heavens look like tonight, because
          what they look like has drifted. The system kept the names anyway
          because the math still works.
        </p>
      </ProseSection>

      <ProseSection id="s02" kicker="§ 02" title="Yes, but the constellations">
        <p>
          The signs and the constellations of the same name no longer
          overlap. Two thousand years ago, when Hellenistic astrologers fixed
          the names, they did. They no longer do. Earth&rsquo;s axis wobbles in
          a slow ~26,000-year arc — astronomers call it{" "}
          <GlossaryTerm
            term="precession"
            definition="The slow ~26,000-year wobble of Earth's rotational axis. Causes the equinox points to drift backwards through the constellations over time."
          >
            precession
          </GlossaryTerm>
          {" "}— and the Sun now rises against different stars than it did in
          the age of Hipparchus. Western astrology kept the calendar — signs
          anchored to the seasons and the equinoxes, the{" "}
          <em>tropical zodiac</em>. Vedic astrology kept the stars — signs
          anchored to the actual constellations, the <em>sidereal zodiac</em>.
          This Academy teaches tropical, and we name the drift up front
          because anyone bothering to think it through will ask. Both systems
          are internally coherent. Neither is the other one&rsquo;s mistake. The
          pop-astrology version that pretends the drift does not exist is.
        </p>

        <h4>Why a measuring tape matters</h4>
        <p>
          Once you accept that a sign is a coordinate, every other concept in
          astrology stops feeling like jargon. Planets sit at coordinates.
          The angles of your chart — the rising sign, the midheaven — are
          coordinates. Aspects, the geometric relationships between planets,
          are measured between coordinates. Houses are slices of coordinates
          rotated against your birthplace. The whole craft is one extended
          exercise in plotting positions on a 360° dial and asking what the
          geometry means. Lose the dial and you lose the craft. That is why
          this is Lesson 02: every subsequent lesson in this Academy assumes
          you can read a sign as a number first and a meaning second.
        </p>
        <p>
          The twelve signs are not twelve random labels either. They sort
          cleanly into two axes. <em>Modality</em> is how a sign moves —
          Cardinal signs initiate, Fixed signs sustain, Mutable signs adapt.{" "}
          <em>Element</em> is what a sign is made of — Fire is action, Earth
          is matter, Air is mind, Water is feeling. Three modalities, four
          elements, twelve intersections. Cardinal Fire is Aries. Fixed Earth
          is Taurus. Mutable Water is Pisces. No leftovers, no overlaps. By
          the end of this lesson you will read each sign as a coordinate{" "}
          <em>and</em> as a position in that grid — the catalog of twelve and
          the system they belong to, in one breath.
        </p>
      </ProseSection>

      {/* ─── The 12 signs, grouped by element ──────────────────────────
          Each ElementSection sets a magazine-style chapter break with a
          numbered header (01/04 · FIRE) + caption + member list, then
          stacks its three signs in a single article column. Card numbers
          stay continuous via startIndex so Aries=01 and Pisces=12. */}
      {ELEMENT_GROUPS.map((group, gi) => {
        const signs = SIGNS.filter((s) => s.element === group.element);
        return (
          <ElementSection
            key={group.element}
            number={gi + 1}
            total={ELEMENT_GROUPS.length}
            title={group.element}
            caption={group.caption}
            members={signs.map((s) => s.name).join(" · ")}
            startIndex={gi * signs.length}
          >
            {signs.map((sign) => (
              <SignConceptCard key={sign.name} sign={sign} />
            ))}
          </ElementSection>
        );
      })}

      {/* Bridge into §03: the matrix is the synthesis of the twelve cards
          above — twelve portraits resolve into one grid. The s03 anchor
          here pairs with the third objective ("Place every sign in the
          3×4 grid"). */}
      <ProseSection id="s03" kicker="§ 03" title="The grid">
        <p>
          You have met the twelve. Now see them all at once. The 3×4 grid
          below collapses every sign into a single coordinate of modality
          and element — three rows for how a sign moves, four columns for
          what it is made of, every sign at exactly one intersection. This
          is the structural truth behind the personalities.
        </p>
      </ProseSection>

      <ModalityMatrix />

      {/* Bridge from the figure into the recap. Without this, the matrix
          slams straight into the checklist. */}
      <ProseSection>
        <p>
          That is the whole system on one page. Twelve coordinates, three
          modalities, four elements, no leftovers. The rest of this Academy
          is just learning what gets parked in each coordinate — and what
          the geometry between coordinates means.
        </p>
      </ProseSection>

      <SourcesPanel
        sources={[
          {
            author: "Brennan, Chris",
            title: "Hellenistic Astrology: The Study of Fate and Fortune",
            year: 2017,
            note: "On the historical origin of the 12-sign tropical zodiac and its early definitions.",
          },
          {
            author: "Hand, Robert",
            title: "Horoscope Symbols",
            year: 1981,
            note: "A clear modern treatment of modality, element, and what each sign 'does.'",
          },
        ]}
      />

      <RelatedGuides
        label="Read next"
        guides={getGuides(["viewing-the-stars", "constellations", "natal-chart"])}
      />
    </LessonShell>
  );
}
