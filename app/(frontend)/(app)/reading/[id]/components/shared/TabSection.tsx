"use client";

import type { ReactNode } from "react";
import { ReadingCopyBlock, ReadingGuideFlow, ReadingGuideRows, RichText, type ReadingGuideRow, RichTextNode, structureReadingCopy } from "./ReadingCopy";
import {
    AsteriskStarburst,
    GeodeticGrid,
    MonolineStar,
    OrbitalPaths,
    PhaseMoon,
    Sunburst,
    WireframeGlobe,
} from "@/app/components/ui/svg-shapes";

interface Props {
    kicker: string;
    title: string;
    /** AI-authored outcome-first opener rendered as short reading copy. */
    lead?: string;
    /** Plain-English summary or supporting paragraph below the dek. */
    intro?: ReactNode;
    /** Short practical rows rendered below the interpretation copy. */
    guideRows?: ReadingGuideRow[];
    maxSentences?: number;
    /** When true, intro renders as a wide blue-bordered callout (used by Overview).
     *  When false, intro renders as plain body copy capped at 580px. */
    wideIntro?: boolean;
    titleNoWrap?: boolean;
    quietCopy?: boolean;
    preserveGuideLabels?: boolean;
    guideLayout?: "compact" | "flow";
    guideFlowVariant?: "overview" | "timing";
    guideSurface?: "ledger" | "cards";
    children: ReactNode;
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";

/**
 * Shared step container for the V4 reading tabs. Hierarchy:
 *   kicker (mono label) → title (short H2) → short copy → guide rows
 */
export default function TabSection({
    kicker,
    title,
    lead,
    intro,
    guideRows,
    maxSentences,
    wideIntro,
    titleNoWrap,
    quietCopy,
    preserveGuideLabels,
    guideLayout = "compact",
    guideFlowVariant,
    guideSurface = "ledger",
    children,
}: Props) {
    const leadText = lead?.trim() ?? "";
    const introText = typeof intro === "string" ? intro.trim() : "";
    const showIntroNode =
        !!intro && typeof intro !== "string" && !leadText;
    const structuredCopy = guideLayout === "flow"
        ? structureReadingCopy({
            lead: leadText,
            intro: introText && introText !== leadText ? introText : undefined,
            guideRows,
            maxSentences,
            preserveGuideLabels,
        })
        : null;

    return (
        <section className="px-0 py-5 sm:py-7">
            <div className="w-full max-w-none m-0">
                <div className="mb-6">
                    <div className="mb-4 flex items-center gap-2.5">
                        <TabDefinitionGlyph kicker={kicker} />
                        <div
                            className="text-[11px] tracking-[0.22em] uppercase"
                            style={{ fontFamily: FONT_MONO, color: "var(--color-y2k-blue)" }}
                        >
                            {kicker}
                        </div>
                    </div>
                    <h2
                        className={`font-normal leading-[1.05] tracking-[-0.02em] m-0 max-w-[28ch] ${titleNoWrap ? "[text-wrap:balance] sm:whitespace-nowrap sm:[text-wrap:normal]" : "[text-wrap:balance]"}`}
                        style={{
                            fontFamily: FONT_PRIMARY,
                            fontSize: "clamp(28px, 3.4vw, 44px)",
                            color: "var(--text-primary)",
                        }}
                    >
                        {title}
                    </h2>
                </div>
                {structuredCopy ? (
                    <>
                        {structuredCopy.paragraphs.length > 0 && (
                            <div className={wideIntro ? "mb-[clamp(30px,3.5vw,44px)] border-l-4 pl-[clamp(18px,2.4vw,28px)]" : "mb-[clamp(24px,3vw,36px)]"} style={wideIntro ? { borderColor: "var(--color-y2k-blue)" } : undefined}>
                                <div className="flex flex-col gap-3">
                                    {structuredCopy.paragraphs.map((paragraph, index) => (
                                        <p
                                            key={index}
                                            className="m-0 [text-wrap:pretty]"
                                            style={{
                                                fontFamily: FONT_BODY,
                                                fontSize: "clamp(16px, 1.15vw, 18px)",
                                                lineHeight: 1.65,
                                                color: "var(--text-primary)",
                                                fontWeight: 400,
                                                maxWidth: wideIntro ? "100%" : "86ch",
                                                width: "100%",
                                            }}
                                        >
                                            <RichText autoEmphasis={!quietCopy} allowBold={!quietCopy}>{paragraph}</RichText>
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="reading-guide-responsive">
                            <div className="reading-guide-responsive__compact">
                                <ReadingGuideRows
                                    rows={structuredCopy.guideRows}
                                    autoEmphasis={!quietCopy}
                                    allowBold={!quietCopy}
                                    preserveLabels={preserveGuideLabels}
                                    surface={guideSurface}
                                />
                            </div>
                            <div className="reading-guide-responsive__flow">
                                <ReadingGuideFlow
                                    rows={structuredCopy.guideRows}
                                    variant={guideFlowVariant}
                                    autoEmphasis={!quietCopy}
                                    allowBold={!quietCopy}
                                    preserveLabels={preserveGuideLabels}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <ReadingCopyBlock
                        lead={leadText}
                        intro={introText && introText !== leadText ? introText : undefined}
                        guideRows={guideRows}
                        maxSentences={maxSentences}
                        wide={wideIntro}
                        autoEmphasis={!quietCopy}
                        allowBold={!quietCopy}
                        preserveGuideLabels={preserveGuideLabels}
                        guideSurface={guideSurface}
                    />
                )}
                {showIntroNode && (
                    wideIntro ? (
                        <p
                            className="relative mb-[clamp(42px,5vw,64px)] p-[clamp(20px,3vw,30px)] border-l-4 leading-[1.65]"
                            style={{
                                fontFamily: FONT_BODY,
                                fontSize: "clamp(17px, 1.45vw, 20px)",
                                color: "var(--text-primary)",
                                borderColor: "var(--color-y2k-blue)",
                                background: "color-mix(in oklab, var(--color-y2k-blue) 7%, transparent)",
                            }}
                        >
                            <RichTextNode>{intro}</RichTextNode>
                        </p>
                    ) : (
                        <p
                            className="text-[16px] leading-[1.6] font-light max-w-[60ch] [text-wrap:pretty] m-0 mb-9"
                            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                        >
                            <RichTextNode>{intro}</RichTextNode>
                        </p>
                    )
                )}
                {children}
            </div>
        </section>
    );
}

function TabDefinitionGlyph({ kicker }: { kicker: string }) {
    const key = kicker.toLowerCase();
    const variant =
        key.includes("overview") ? "overview"
        : key.includes("life") ? "life"
        : key.includes("geography") ? "geography"
        : key.includes("shift") ? "shifts"
        : key.includes("timing") ? "timing"
        : "overview";

    return (
        <div
            aria-hidden
            data-reading-tab-glyph={variant}
            className="relative flex h-[clamp(28px,3.4vw,38px)] w-[clamp(28px,3.4vw,38px)] shrink-0 items-center justify-center overflow-visible"
            style={{
                color: "var(--color-y2k-blue)",
                opacity: 0.72,
            }}
        >
            {variant === "overview" && <OverviewGlyph />}
            {variant === "life" && <LifeGlyph />}
            {variant === "geography" && <GeographyGlyph />}
            {variant === "shifts" && <ShiftsGlyph />}
            {variant === "timing" && <TimingGlyph />}
        </div>
    );
}

function OverviewGlyph() {
    return (
        <>
            <OrbitalPaths size="84%" className="absolute opacity-[0.26]" />
            <AsteriskStarburst size="22%" className="absolute right-[15%] top-[13%] opacity-85" />
            <svg viewBox="0 0 100 100" className="relative h-[78%] w-[78%]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="50" cy="50" r="21" fill="currentColor" opacity="0.16" strokeWidth="2" />
                <path d="M27 55c14-13 35-15 48-5M25 65c16 7 38 4 52-7" strokeWidth="2" opacity="0.72" />
                <path d="M44 36c2.6 3 5.2 3 7.8 0M53 36c2.6 3 5.2 3 7.8 0" strokeWidth="2" opacity="0.72" />
                <path d="M44 50c4.2 3.6 10.8 3.6 15 0" strokeWidth="2.2" opacity="0.72" />
            </svg>
        </>
    );
}

function LifeGlyph() {
    return (
        <>
            <GeodeticGrid size="100%" className="absolute opacity-[0.16]" />
            <MonolineStar size="18%" className="absolute right-[17%] top-[18%] opacity-80" />
            <svg viewBox="0 0 100 100" className="relative h-[78%] w-[78%]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 35c0-9 7-15 15-15 6.5 0 11 3.8 13 9 2-5.2 6.5-9 13-9 8 0 15 6 15 15 0 17-28 33-28 33S22 52 22 35Z" fill="currentColor" opacity="0.12" strokeWidth="2" />
                <path d="M29 58l12-17 12 10 19-25" strokeWidth="2.3" opacity="0.78" />
                <circle cx="29" cy="58" r="4.4" fill="currentColor" stroke="none" />
                <circle cx="41" cy="41" r="3.8" fill="currentColor" stroke="none" opacity="0.82" />
                <circle cx="53" cy="51" r="3.8" fill="currentColor" stroke="none" opacity="0.82" />
                <circle cx="72" cy="26" r="4.6" fill="currentColor" stroke="none" />
            </svg>
        </>
    );
}

function GeographyGlyph() {
    return (
        <>
            <WireframeGlobe size="88%" className="absolute opacity-[0.2]" />
            <svg viewBox="0 0 100 100" className="relative h-[86%] w-[86%]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M28 57l29-14 13 27-29 14Z" fill="currentColor" opacity="0.16" strokeWidth="2.2" />
                <path d="M20 64l23-11M57 43l23-11" strokeWidth="3.4" opacity="0.82" />
                <circle cx="80" cy="32" r="9" fill="currentColor" opacity="0.18" strokeWidth="2.2" />
                <path d="M39 76l-10 15M55 69l8 19M33 84h27" strokeWidth="2.5" opacity="0.78" />
                <AsteriskStarburst size="17%" className="absolute left-[16%] top-[14%] opacity-75" />
            </svg>
        </>
    );
}

function ShiftsGlyph() {
    return (
        <>
            <PhaseMoon size="34%" className="absolute left-[10%] top-[12%] opacity-[0.26]" />
            <Sunburst size="46%" className="absolute right-[5%] bottom-[4%] opacity-[0.16]" />
            <svg viewBox="0 0 100 100" className="relative h-[88%] w-[88%]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M52 14c12 9 16 23 12 38L50 68 36 52c-4-15 0-29 16-38Z" fill="currentColor" opacity="0.2" strokeWidth="2.3" />
                <circle cx="52" cy="35" r="6" fill="currentColor" opacity="0.32" strokeWidth="2" />
                <path d="M39 54l-14 5 9-19M61 54l14 5-9-19" fill="currentColor" opacity="0.13" strokeWidth="2.1" />
                <path d="M45 66c-6 4-9 9-10 17 6-3 10-6 15-14 5 8 9 11 15 14-1-8-4-13-10-17" fill="currentColor" opacity="0.28" strokeWidth="2.1" />
                <path d="M24 25l2.2 1.3 2.2-1.3-1.3 2.2 1.3 2.2-2.2-1.3-2.2 1.3 1.3-2.2ZM72 19l2 1.2 2-1.2-1.2 2 1.2 2-2-1.2-2 1.2 1.2-2Z" fill="currentColor" stroke="none" opacity="0.78" />
            </svg>
        </>
    );
}

function TimingGlyph() {
    return (
        <>
            <OrbitalPaths size="86%" className="absolute opacity-[0.24]" />
            <AsteriskStarburst size="17%" className="absolute right-[15%] top-[14%] opacity-80" />
            <svg viewBox="0 0 100 100" className="relative h-[86%] w-[86%]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <rect x="38" y="38" width="24" height="24" rx="5" fill="currentColor" opacity="0.16" strokeWidth="2.2" />
                <path d="M32 32l-13-13M68 32l13-13M32 68l-13 13M68 68l13 13" strokeWidth="2.6" opacity="0.76" />
                <path d="M50 38V22M50 62v16M38 50H22M62 50h16" strokeWidth="2.2" opacity="0.65" />
                <circle cx="50" cy="50" r="5" fill="currentColor" stroke="none" />
            </svg>
        </>
    );
}
