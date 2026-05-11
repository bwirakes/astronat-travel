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
  GlossaryTerm,
  getLesson,
  getGuides,
} from "../_components";

// ═══════════════════════════════════════════════════════════════
// SVG DATA
// ═══════════════════════════════════════════════════════════════

const JAKARTA_X = 285;
const JAKARTA_Y = 638;

const ACG_LINES = [
  {
    id: "pluto-dsc",
    planet: "Pluto",
    angle: "DSC",
    color: "var(--color-planet-mars)",
    glow: "rgba(180,40,40,0.7)",
    path: "M 257 -43 L 261 -32 L 264 -21 L 267 -11 L 271 0 L 274 11 L 277 21 L 280 32 L 283 43 L 287 53 L 290 64 L 293 74 L 296 85 L 299 96 L 302 106 L 305 117 L 308 128 L 311 138 L 314 149 L 317 160 L 320 170 L 322 181 L 325 191 L 328 202 L 331 213 L 334 223 L 337 234 L 340 245 L 342 255 L 345 266 L 348 277 L 351 287 L 353 298 L 356 309 L 359 319 L 362 330 L 364 340 L 367 351 L 370 362 L 372 372 L 375 383 L 378 394 L 380 404 L 383 415 L 386 426 L 388 436 L 391 447 L 394 457 L 396 468 L 399 479 L 402 489 L 404 500 L 407 511 L 410 521 L 412 532 L 415 543 L 418 553 L 420 564 L 423 574 L 426 585 L 428 596 L 431 606 L 434 617 L 436 628 L 439 638 L 441 649 L 444 660 L 447 670 L 450 681 L 452 691 L 455 702 L 458 713 L 460 723 L 463 734 L 466 745 L 468 755 L 471 766 L 474 777 L 477 787 L 480 798 L 482 809 L 485 819 L 488 830 L 491 840 L 494 851 L 496 862 L 499 872 L 502 883 L 505 894 L 508 904 L 511 915 L 514 926 L 517 936 L 520 947 L 523 957 L 526 968 L 529 979 L 532 989 L 535 1000 L 538 1011 L 541 1021 L 544 1032 L 548 1043",
  },
  {
    id: "moon-dsc",
    planet: "Moon",
    angle: "DSC",
    color: "var(--color-acqua)",
    glow: "rgba(202,241,240,0.7)",
    path: "M -43 -43 L -41 -32 L -40 -21 L -38 -11 L -36 0 L -34 11 L -33 21 L -31 32 L -29 43 L -28 53 L -26 64 L -24 74 L -23 85 L -21 96 L -20 106 L -18 117 L -16 128 L -15 138 L -13 149 L -12 160 L -10 170 L -9 181 L -7 191 L -6 202 L -4 213 L -3 223 L -1 234 L 0 245 L 2 255 L 3 266 L 5 277 L 6 287 L 8 298 L 9 309 L 11 319 L 12 330 L 14 340 L 15 351 L 16 362 L 18 372 L 19 383 L 21 394 L 22 404 L 24 415 L 25 426 L 26 436 L 28 447 L 29 457 L 31 468 L 32 479 L 33 489 L 35 500 L 36 511 L 38 521 L 39 532 L 40 543 L 42 553 L 43 564 L 45 574 L 46 585 L 47 596 L 49 606 L 50 617 L 52 628 L 53 638 L 55 649 L 56 660 L 57 670 L 59 681 L 60 691 L 62 702 L 63 713 L 65 723 L 66 734 L 67 745 L 69 755 L 70 766 L 72 777 L 73 787 L 75 798 L 76 809 L 78 819 L 79 830 L 81 840 L 82 851 L 84 862 L 85 872 L 87 883 L 88 894 L 90 904 L 91 915 L 93 926 L 95 936 L 96 947 L 98 957 L 99 968 L 101 979 L 102 989 L 104 1000 L 106 1011 L 107 1021 L 109 1032 L 111 1043",
  },
  {
    id: "sun-ic",
    planet: "Sun",
    angle: "IC",
    color: "var(--gold)",
    glow: "rgba(201,169,110,0.8)",
    path: "M 805 0 L 805 1000",
  },
  {
    id: "jupiter-asc",
    planet: "Jupiter",
    angle: "ASC",
    color: "var(--sage)",
    glow: "rgba(0,253,0,0.6)",
    path: "M 673 -43 L 678 -32 L 683 -21 L 688 -11 L 692 0 L 697 11 L 702 21 L 706 32 L 711 43 L 716 53 L 720 64 L 725 74 L 729 85 L 733 96 L 738 106 L 742 117 L 746 128 L 751 138 L 755 149 L 759 160 L 763 170 L 768 181 L 772 191 L 776 202 L 780 213 L 784 223 L 788 234 L 792 245 L 796 255 L 800 266 L 805 277 L 809 287 L 812 298 L 816 309 L 820 319 L 824 330 L 828 340 L 832 351 L 836 362 L 840 372 L 844 383 L 848 394 L 852 404 L 856 415 L 859 426 L 863 436 L 867 447 L 871 457 L 875 468 L 879 479 L 882 489 L 886 500 L 890 511 L 894 521 L 898 532 L 902 543 L 905 553 L 909 564 L 913 574 L 917 585 L 921 596 L 925 606 L 928 617 L 932 628 L 936 638 L 940 649 L 944 660 L 948 670 L 952 681 L 955 691 L 959 702 L 963 713 L 967 723 L 971 734 L 975 745 L 979 755 L 983 766 L 987 777 L 991 787 L 995 798 L 999 809 L 1003 819 L 1007 830 L 1011 840 L 1015 851 L 1019 862 L 1024 872 L 1028 883 L 1032 894 L 1036 904 L 1040 915 L 1045 926 L 1049 936 L 1053 947 L 1058 957",
  },
];

function AcgMap() {
  return (
    <div className="relative w-full aspect-[4/3] bg-black overflow-hidden rounded-[var(--shape-asymmetric-md)]">
      <Image
        src="/sea-map-dark.png"
        alt="Southeast Asia dark cartography"
        fill
        className="object-cover opacity-80"
      />
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <svg viewBox="0 0 1000 1000" className="absolute inset-0 w-full h-full z-10 pointer-events-none" preserveAspectRatio="xMidYMid slice">
        {/* Birth city pin */}
        <circle cx={JAKARTA_X} cy={JAKARTA_Y} r="6" fill="var(--color-y2k-blue)" opacity="0.9" />
        <circle cx={JAKARTA_X} cy={JAKARTA_Y} r="12" fill="none" stroke="var(--color-y2k-blue)" strokeWidth="1.5" opacity="0.4" />
        <text x={JAKARTA_X + 15} y={JAKARTA_Y - 4} fill="var(--color-y2k-blue)" fontSize="15" fontFamily="var(--font-mono)" fontWeight="bold" letterSpacing="0.1em">
          JAKARTA
        </text>

        {ACG_LINES.map((line) => (
          <path
            key={line.id}
            d={line.path}
            fill="none"
            stroke={line.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={line.angle === "IC" || line.angle === "DSC" ? "12 6" : "none"}
            style={{ filter: `drop-shadow(0 0 10px ${line.glow})` }}
          />
        ))}
      </svg>
    </div>
  );
}

export default function AcgLessonPage() {
  const lesson = getLesson("astrocartography");

  return (
    <LessonShell lessonId="astrocartography">
      <GuideHeader
        guide={lesson}
        title="Astrocartography"
        titleItalic="Lines"
        lede="Astrocartography is the practice of relocating your birth chart across the surface of the Earth. Every planet draws a line. Every line crosses a city. And depending on which planet crosses which angle—identity, partnership, career, or home—that city changes you in a specific, predictable way."
      />

      <ProseSection id="s01" kicker="§ 01" title="The Mechanics">
        <p>
          Your natal chart is calculated for the exact latitude and longitude of your birth. But what if you had been born at that exact same minute, but in Tokyo? Or London? The planets would be in the same signs, but because the Earth is round, they would appear in entirely different positions in the sky.
        </p>
        <p>
          <GlossaryTerm term="Astrocartography">Astrocartography</GlossaryTerm> calculates these positions globally. If Venus was rising over the eastern horizon in Paris at the moment you were born, then Paris is your Venus Ascendant line. Traveling there will bring Venusian themes (magnetism, ease, beauty) directly into your physical identity.
        </p>

        <Plate number="01" title="Planetary Lines Over Southeast Asia">
          <AcgMap />
        </Plate>
      </ProseSection>

      <ProseSection id="s02" kicker="§ 02" title="The Four Angles">
        <p>
          Astrocartography lines only occur when a planet aligns with one of the four cardinal angles of the chart. The angle determines <em>where</em> the planet's energy will manifest in your life:
        </p>
        <ul className="list-disc pl-5 mt-4 space-y-3 opacity-90 font-body text-base">
          <li><strong>Ascendant (ASC):</strong> The strongest line. It changes how you look, how you feel in your body, and how people perceive you instantly.</li>
          <li><strong>Descendant (DSC):</strong> The relationship line. You attract people who embody the planet on this line. It rules marriage, business partners, and open enemies.</li>
          <li><strong>Midheaven (MC):</strong> The career line. This is where you become visible to the public. You go to these lines to build a legacy or get famous.</li>
          <li><strong>Imum Coeli (IC):</strong> The home line. This is where you put down roots. It brings the planet's energy into your private life, family, and deepest emotional foundations.</li>
        </ul>
      </ProseSection>

      <ProseSection id="s03" kicker="§ 03" title="Orb and Distance">
        <p>
          A line does not have to run directly through a city for you to feel it. Astrocartography operates on a radius, known as an orb. 
        </p>
        <p>
          If you are within 200 miles (approx. 320 km) of a line, the effect is considered exact and undeniable. Between 200 and 500 miles, it is a major influence. Beyond 500 miles, the influence fades significantly, becoming background noise. This is why calculating the exact distance to your destination is critical.
        </p>
      </ProseSection>

      <PullQuote attribution="— Astro-Nat">
        You do not just travel to a place. You travel to the version of yourself that lives there.
      </PullQuote>

      <RelatedGuides
        label="Read next"
        guides={getGuides(["geodetic-astrology", "malefic-benefic", "houses"])}
      />
    </LessonShell>
  );
}
