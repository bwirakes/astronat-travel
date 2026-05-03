import SignIcon from "@/app/components/SignIcon";
import {
  LessonShell,
  LessonIntro,
  ConceptZero,
  ConceptStack,
  ConceptCard,
  Recap,
  SourcesPanel,
  PaginationCard,
  DiagramFigure,
  Aside,
  GlossaryTerm,
  getNext,
  getPrev,
} from "../_components";

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
  Cardinal: "Initiates. Starts the season.",
  Fixed: "Sustains. Holds the season.",
  Mutable: "Adapts. Releases the season.",
};

const ELEMENT_DESC: Record<Element, string> = {
  Fire: "Action, will, vitality.",
  Earth: "Body, matter, what lasts.",
  Air: "Mind, language, exchange.",
  Water: "Feeling, depth, undercurrent.",
};

function ModalityMatrix() {
  const findSign = (mod: Modality, el: Element) =>
    SIGNS.find((s) => s.modality === mod && s.element === el)!;

  return (
    <DiagramFigure
      number={1}
      caption="Every sign is one cell in this 3×4 grid. The modality says how the sign moves; the element says what material it moves through."
    >
      <div className="overflow-x-auto bg-[var(--bg-raised)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--surface-border)]">
              <th className="p-4 font-mono text-[9px] uppercase tracking-[0.25em] opacity-50 align-bottom" />
              {ELEMENTS.map((e) => (
                <th
                  key={e}
                  className="p-4 align-bottom border-l border-[var(--surface-border)]"
                >
                  <div className="font-primary text-xl tracking-tight uppercase">
                    {e}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-widest opacity-50 mt-1">
                    {ELEMENT_DESC[e]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODALITIES.map((m) => (
              <tr key={m} className="border-b border-[var(--surface-border)]">
                <th className="p-4 align-top">
                  <div className="font-primary text-xl tracking-tight uppercase">
                    {m}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-widest opacity-50 mt-1 max-w-[12ch]">
                    {MODALITY_DESC[m]}
                  </div>
                </th>
                {ELEMENTS.map((e) => {
                  const sign = findSign(m, e);
                  return (
                    <td
                      key={e}
                      className="p-4 align-top border-l border-[var(--surface-border)]"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="text-2xl"
                          style={{ color: "var(--lesson-accent)" }}
                        >
                          {sign.symbol}
                        </span>
                        <div>
                          <div className="font-primary text-base tracking-tight uppercase">
                            {sign.name}
                          </div>
                          <div className="font-mono text-[9px] uppercase tracking-widest opacity-50">
                            {sign.dates.split(" — ")[0]}
                          </div>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DiagramFigure>
  );
}

export default function ZodiacLessonPage() {
  const prev = getPrev("zodiac");
  const next = getNext("zodiac");

  return (
    <LessonShell lessonId="zodiac">
      <LessonIntro
        eyebrow="The Zodiac"
        title={["The", "Zodiac"]}
        italicLine={1}
        lede="Twelve 30° slices of the sky. They are how astrologers measure where things are — and the system every other lesson in this Academy uses."
        objectives={[
          "Read the zodiac as 360° of ecliptic longitude, divided into 12 equal sectors.",
          "Tell signs apart from constellations — and know why they drifted.",
          "Place every sign in the 3×4 grid of modality × element.",
        ]}
        prereqs={[
          { label: "Viewing the Stars", href: "/learn/viewing-the-stars" },
        ]}
      />

      <ConceptZero>
        The zodiac is a 360° band of sky, centered on the{" "}
        <GlossaryTerm
          term="ecliptic"
          definition="The plane of Earth's orbit around the Sun, projected onto the sky. The Sun, Moon, and planets all appear to move along this line."
        >
          ecliptic
        </GlossaryTerm>
        , divided into twelve 30° sectors. Each sector is a sign. Signs are
        coordinates on a measuring tape, not the constellations they were once
        named for.
      </ConceptZero>

      <section className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <Aside label="Signs ≠ constellations">
          About 2,000 years ago the 12 signs and the 12 constellations
          overlapped. They no longer do. Earth&apos;s axis wobbles ({" "}
          <GlossaryTerm
            term="precession"
            definition="The slow ~26,000-year wobble of Earth's rotational axis. Causes the equinox points to drift backwards through the constellations over time."
          >
            precession
          </GlossaryTerm>
          ), so the Sun rises against different stars now than it did in the
          age of Hipparchus. Western astrology kept the calendar (the{" "}
          <em>tropical zodiac</em>, anchored to the equinoxes); Vedic astrology
          kept the stars (the <em>sidereal zodiac</em>). This Academy teaches
          tropical — but acknowledges the drift, because it&apos;s the most common
          objection a skeptical reader will raise. Both systems are
          internally coherent.
        </Aside>
      </section>

      <section className="px-6 md:px-12 lg:px-20 py-8 max-w-7xl mx-auto">
        <ModalityMatrix />
      </section>

      <ConceptStack layout="grid">
        {SIGNS.map((sign) => (
          <ConceptCard
            key={sign.name}
            kicker={`${sign.modality} ${sign.element}`}
            title={sign.name}
            tradition="hellenistic"
            badge={<SignIcon sign={sign.name} size={28} />}
            watermark={sign.symbol}
            meta={[
              { label: "Dates", value: sign.dates },
              { label: "Gift", value: sign.gift, tone: "positive" },
              { label: "Shadow", value: sign.shadow, tone: "warning" },
            ]}
          >
            <p>{sign.desc}</p>
          </ConceptCard>
        ))}
      </ConceptStack>

      <Recap
        items={[
          "The zodiac is 360° of ecliptic longitude divided into twelve 30° signs.",
          "Signs and constellations share names but no longer share positions — the difference is precession.",
          "Every sign sits at one intersection of modality (Cardinal / Fixed / Mutable) and element (Fire / Earth / Air / Water).",
        ]}
      />

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

      <PaginationCard
        prev={prev}
        next={next}
        bridge={
          next?.bridge ??
          "Now meet the actual star groups behind the signs — and the precession story in full."
        }
      />
    </LessonShell>
  );
}
