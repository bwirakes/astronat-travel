"use client";

import type { CSSProperties, ReactNode } from "react";
import { AbstractSaturn, AsteriskStarburst, MonolineStar, OrbitalPaths, PhaseMoon, Sunburst } from "@/app/components/ui/svg-shapes";

export type ReadingGuideLabel = "Best Used For" | "Move Carefully With" | "Your Next Move";
export type ReadingGuideBadgeVariant =
    | "overview-use"
    | "overview-avoid"
    | "overview-next"
    | "timing-window"
    | "timing-watch"
    | "timing-pace"
    | "theme-use"
    | "theme-avoid";

export interface ReadingGuideRow {
    label: ReadingGuideLabel | string;
    body: string;
    badgeVariant?: ReadingGuideBadgeVariant;
}

type ChartRulerDisplay = {
    ruler?: string;
    rulerSign?: string;
    dignity?: string;
    planetNature?: "benefic" | "malefic" | "luminary" | "neutral";
    rulerRelocatedHouse?: number;
    toHouse?: number;
};

const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";
const IMPORTANT_TERM_RE = /\b(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Ascendant|Descendant|Midheaven|Nadir|ASC|DSC|MC|IC|chart ruler|relocated chart|relocated rising|geodetic|benefic|malefic|exalted|exaltation|detriment|fall|domicile|identity|wealth|3rd house|H[1-9]|H1[0-2]|\d+(?:st|nd|rd|th)\s+house|\d+\/100|\d+\s?out of\s?100)\b/gi;

const GUIDE_LABELS = [
    "Best Used For",
    "Move Carefully With",
    "Your Next Move",
    "Good for",
    "Use this for",
    "Useful for",
    "Don't use this for",
    "Do not use this for",
    "Watch",
    "Watch out",
    "Move carefully with",
    "Avoid",
    "Not for",
    "Do not force",
    "Next move",
    "Do this",
    "Try this",
    "Practical move",
    "So what",
] as const;

function normalizeGuideLabel(label: string): ReadingGuideLabel {
    const clean = label.toLowerCase().replace(/[^a-z ]/g, "").trim();
    if (clean.includes("move carefully") || clean.includes("watch") || clean.includes("avoid") || clean.includes("not for") || clean.includes("dont use") || clean.includes("do not use") || clean.includes("do not force")) {
        return "Move Carefully With";
    }
    if (clean.includes("next") || clean.includes("do this") || clean.includes("try") || clean.includes("practical") || clean.includes("so what")) {
        return "Your Next Move";
    }
    return "Best Used For";
}

function stripListMarker(text: string): string {
    return text.replace(/^\s*[-*•]\s+/, "").trim();
}

function cleanMarkdownShell(text: string): string {
    return text
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\s+\n/g, "\n")
        .replace(/\n\s+/g, "\n")
        .trim();
}

function cleanGuideBody(text: string): string {
    return cleanMarkdownShell(text)
        .replace(/^\*\*/, "")
        .replace(/\*\*$/, "")
        .replace(/\s+/g, " ")
        .replace(/^[\s:;,.—-]+/, "")
        .trim();
}

function displayGuideLabel(label: string): string {
    if (label === "Best Used For") return "Best For";
    if (label === "Move Carefully With") return "Be Careful With";
    if (label === "Your Next Move") return "Do Next";
    return label;
}

function sentenceParts(text: string): string[] {
    const clean = cleanMarkdownShell(text).replace(/\n+/g, " ");
    if (!clean) return [];
    return clean.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [clean];
}

function normalizeDignity(dignity: unknown): string {
    return String(dignity ?? "").toLowerCase().replace(/_/g, " ").trim();
}

function dignityMeaning(dignity: string): string {
    if (dignity.includes("exalt")) return "exalted means it works strongly and more reliably";
    if (dignity.includes("domicile") || dignity.includes("rul")) return "domicile means it is at home and easier to trust";
    if (dignity.includes("detriment")) return "detriment means it works with more effort and less comfort";
    if (dignity.includes("fall")) return "fall means it needs extra care and can feel less steady";
    return dignity ? `${dignity} describes how comfortably that planet can work` : "";
}

function natureMeaning(nature: ChartRulerDisplay["planetNature"]): string {
    if (nature === "benefic") return "benefic means it tends to support, connect, and open doors";
    if (nature === "malefic") return "malefic means it tends to pressure, sharpen, and demand discipline";
    if (nature === "luminary") return "luminary means it makes the theme visible and personal";
    return "";
}

function ordinalHouse(house: unknown): string {
    const n = Number(house);
    if (!Number.isFinite(n)) return "";
    const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
    return `${n}${suffix}`;
}

function hasNeededChartRulerTerms(text: string, chartRuler?: ChartRulerDisplay | null): boolean {
    const dignity = normalizeDignity(chartRuler?.dignity);
    const needsDignity = Boolean(dignity);
    const needsNature = chartRuler?.planetNature === "benefic" || chartRuler?.planetNature === "malefic" || chartRuler?.planetNature === "luminary";
    const hasDignity = /\b(exalted|exaltation|detriment|fall|domicile)\b/i.test(text);
    const hasNature = /\b(benefic|malefic|luminary)\b/i.test(text);
    return (!needsDignity || hasDignity) && (!needsNature || hasNature);
}

export function chartRulerDignityNote(chartRuler?: ChartRulerDisplay | null): string {
    if (!chartRuler?.ruler) return "";
    const dignity = normalizeDignity(chartRuler.dignity);
    const dignityText = dignityMeaning(dignity);
    const natureText = natureMeaning(chartRuler.planetNature);
    const meanings = [natureText, dignityText].filter(Boolean).join("; ");
    if (!meanings) return "";
    const sign = chartRuler.rulerSign ? ` in ${chartRuler.rulerSign}` : "";
    const houseLabel = ordinalHouse(chartRuler.rulerRelocatedHouse ?? chartRuler.toHouse);
    const house = houseLabel ? ` in the relocated ${houseLabel} house` : "";
    const descriptors = [
        chartRuler.planetNature ? `a ${chartRuler.planetNature} planet` : "",
        dignity || "",
    ].filter(Boolean).join(" and ");
    const descriptorClause = descriptors ? `, ${descriptors},` : "";
    return `${chartRuler.ruler}${descriptorClause} sits${sign}${house}, so ${meanings}.`;
}

export function appendChartRulerDignityNote(text: string | undefined, chartRuler?: ChartRulerDisplay | null): string | undefined {
    const base = String(text ?? "").trim();
    const note = chartRulerDignityNote(chartRuler);
    if (!note) return base || undefined;
    if (hasNeededChartRulerTerms(base, chartRuler)) return base || undefined;
    return [base, note].filter(Boolean).join(" ");
}

function sentenceLimit(text: string, max = 1): string {
    return sentenceParts(text).slice(0, max).join(" ").trim();
}

function usefulWordCount(text: string): number {
    return cleanGuideBody(text).split(/\s+/).filter(Boolean).length;
}

export function mergeGuideRows(
    primary: ReadingGuideRow[] | undefined,
    fallback: ReadingGuideRow[] | undefined,
): ReadingGuideRow[] | undefined {
    if (!primary?.length && !fallback?.length) return undefined;
    const byLabel = new Map<string, ReadingGuideRow>();
    for (const row of fallback ?? []) {
        const label = normalizeGuideLabel(row.label);
        const body = cleanGuideBody(row.body);
        if (body) byLabel.set(label, { label, body });
    }
    for (const row of primary ?? []) {
        const label = normalizeGuideLabel(row.label);
        const body = cleanGuideBody(row.body);
        const fallbackRow = byLabel.get(label);
        if (!body) continue;
        byLabel.set(label, usefulWordCount(body) >= 8 || !fallbackRow ? { label, body } : fallbackRow);
    }
    const order: ReadingGuideLabel[] = ["Best Used For", "Move Carefully With", "Your Next Move"];
    return order.map((label) => byLabel.get(label)).filter((row): row is ReadingGuideRow => !!row);
}

function extractLineGuide(line: string): ReadingGuideRow | null {
    const stripped = stripListMarker(line);
    const labels = GUIDE_LABELS.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const match = stripped.match(new RegExp(`^\\*\\*\\s*(${labels})\\s*:?\\s*\\*\\*\\s*[:—-]?\\s*(.+)$`, "i"))
        ?? stripped.match(new RegExp(`^(${labels})\\s*[:—-]\\s*(.+)$`, "i"));
    if (!match) return null;
    const body = cleanGuideBody(match[2] ?? "");
    if (!body) return null;
    return {
        label: normalizeGuideLabel(match[1] ?? ""),
        body: sentenceLimit(body, 1),
    };
}

function splitGoodForSentence(text: string): { bodyText: string; rows: ReadingGuideRow[] } {
    const rows: ReadingGuideRow[] = [];
    let bodyText = text;

    bodyText = bodyText.replace(
        /\bGood for\s+([^.;]+?)(?:,\s*not for|;\s*not for|\s+not for)\s+([^.;]+)([.;]?)/gi,
        (_match, good, careful) => {
            rows.push({ label: "Best Used For", body: cleanGuideBody(good) });
            rows.push({ label: "Move Carefully With", body: cleanGuideBody(careful) });
            return "";
        },
    );

    bodyText = bodyText.replace(
        /\bUse this for\s+([^.;]+?)(?:;\s*do not force|,\s*do not force|\s+do not force)\s+([^.;]+)([.;]?)/gi,
        (_match, good, careful) => {
            rows.push({ label: "Best Used For", body: cleanGuideBody(good) });
            rows.push({ label: "Move Carefully With", body: cleanGuideBody(careful) });
            return "";
        },
    );

    return { bodyText, rows };
}

export function structureReadingCopy({
    lead,
    intro,
    guideRows,
    maxSentences = 5,
    preserveGuideLabels = false,
}: {
    lead?: string;
    intro?: string;
    guideRows?: ReadingGuideRow[];
    maxSentences?: number;
    preserveGuideLabels?: boolean;
}): { paragraphs: string[]; guideRows: ReadingGuideRow[] } {
    const explicitRows = (guideRows ?? [])
        .map((row) => ({
            label: preserveGuideLabels ? cleanMarkdownShell(row.label) : normalizeGuideLabel(row.label),
            body: sentenceLimit(String(row.body ?? ""), 1),
            badgeVariant: row.badgeVariant,
        }))
        .filter((row) => row.body)
        .slice(0, 3);

    const leadText = cleanMarkdownShell(lead ?? "");
    const introText = cleanMarkdownShell(intro ?? "");
    const source = [leadText, introText].filter(Boolean).join("\n\n");
    const lines = source.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const bodyLines: string[] = [];
    const lineRows: ReadingGuideRow[] = [];

    for (const line of lines) {
        const row = extractLineGuide(line);
        if (row) lineRows.push(row);
        else bodyLines.push(line);
    }

    const split = splitGoodForSentence(bodyLines.join(" "));
    const rows = [...explicitRows, ...lineRows, ...split.rows]
        .filter((row, index, arr) => arr.findIndex((other) => other.label === row.label) === index)
        .slice(0, 3);

    const paragraphs = (() => {
        if (leadText || introText) {
            const combined = [...sentenceParts(leadText), ...sentenceParts(introText)]
                .slice(0, maxSentences)
                .join(" ")
                .trim();
            return combined ? [combined] : [];
        }
        return sentenceParts(split.bodyText).slice(0, maxSentences).join(" ")
            .split(/\n{2,}/)
            .map((para) => para.trim())
            .filter(Boolean);
    })();

    return { paragraphs, guideRows: rows };
}

/** Tiny rich-text renderer for AI-authored strings. It only supports
 *  **bold**. Single-star or underscore italics are stripped because italic body
 *  copy is harder to skim for ESL readers. */
export function RichText({
    children,
    autoEmphasis = true,
    allowBold = true,
}: {
    children: string;
    autoEmphasis?: boolean;
    allowBold?: boolean;
}) {
    const normalized = children
        .replace(/(^|[^\*])\*([^\*\n][^\*\n]*?)\*(?!\*)/g, "$1$2")
        .replace(/(^|[^_])_([^_\n][^_\n]*?)_(?!_)/g, "$1$2");
    const plain = allowBold ? normalized : normalized.replace(/\*\*([^*]+)\*\*/g, "$1");
    const parts = normalized.split(/(\*\*[^*]+\*\*)/g);
    const renderAutoEmphasis = (text: string, keyPrefix: string) => {
        if (!autoEmphasis) return text;
        const chunks = text.split(IMPORTANT_TERM_RE);
        const matches = text.match(IMPORTANT_TERM_RE) ?? [];
        return chunks.flatMap((chunk, index) => {
            const match = matches[index];
            const nodes: ReactNode[] = [];
            if (chunk) nodes.push(<span key={`${keyPrefix}-t-${index}`}>{chunk}</span>);
            if (match) {
                nodes.push(
                    <strong key={`${keyPrefix}-e-${index}`} style={{ fontWeight: 650, color: "var(--text-primary)" }}>
                        {match}
                    </strong>,
                );
            }
            return nodes;
        });
    };
    if (!allowBold) {
        return <>{renderAutoEmphasis(plain, "rt-plain")}</>;
    }
    return (
        <>
            {parts.map((part, index) => (
                part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
                    <strong key={index} style={{ fontWeight: 650, color: "var(--text-primary)" }}>
                        {part.slice(2, -2)}
                    </strong>
                ) : (
                    <span key={index}>{renderAutoEmphasis(part, `rt-${index}`)}</span>
                )
            ))}
        </>
    );
}

export function ReadingGuideRows({
    rows,
    accent = "var(--color-y2k-blue)",
    autoEmphasis = true,
    allowBold = true,
    preserveLabels = false,
}: {
    rows: ReadingGuideRow[];
    accent?: string;
    autoEmphasis?: boolean;
    allowBold?: boolean;
    preserveLabels?: boolean;
}) {
    if (!rows.length) return null;
    return (
        <ul className="m-0 mt-6 p-0 list-none grid grid-cols-1 md:grid-cols-3 border-t border-b w-full" style={{ borderColor: "var(--surface-border)" }}>
            {rows.map((row, index) => (
                <li
                    key={`${row.label}-${index}`}
                    className="min-w-0 py-4 md:px-5 md:first:pl-0 md:border-l md:first:border-l-0"
                    style={{ borderColor: "var(--surface-border)" }}
                >
                    <div className="flex items-start gap-3">
                        <GuideRowBadge label={row.label} index={index} variant={row.badgeVariant} />
                        <div className="min-w-0">
                            <span
                                className="block mb-1.5 text-[10px] tracking-[0.16em] uppercase"
                                style={{ fontFamily: FONT_MONO, color: accent, fontWeight: 700 }}
                            >
                                {preserveLabels ? row.label : displayGuideLabel(row.label)}
                            </span>
                            <span
                                className="block text-[14px] leading-[1.55] [text-wrap:pretty]"
                                style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                            >
                                <RichText autoEmphasis={autoEmphasis} allowBold={allowBold}>{row.body}</RichText>
                            </span>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}

export function GuideRowBadge({
    label,
    index,
    variant,
}: {
    label: string;
    index: number;
    variant?: ReadingGuideBadgeVariant;
}) {
    const clean = label.toLowerCase();
    const resolvedVariant = variant ?? (
        clean.includes("watch") || clean.includes("careful") || clean.includes("eye") || clean.includes("don't") || clean.includes("dont") || clean.includes("not use")
            ? "timing-watch"
            : clean.includes("window") || clean.includes("best") || clean.includes("green") || clean.includes("use this")
                ? "timing-window"
                : clean.includes("schedule") || clean.includes("pace") || clean.includes("next") || /\bdo\b/.test(clean)
                    ? "timing-pace"
                    : index === 1
                        ? "timing-watch"
                        : index === 2
                            ? "timing-pace"
                            : "timing-window"
    );
    const tone = resolvedVariant.includes("avoid") || resolvedVariant.includes("watch")
        ? "var(--color-spiced-life)"
        : resolvedVariant.includes("use") || resolvedVariant.includes("theme")
            ? "var(--sage)"
            : resolvedVariant.includes("window")
                ? "var(--amber)"
                : "var(--color-y2k-blue)";
    const bg = `color-mix(in oklab, ${tone} 16%, transparent)`;

    return (
        <span
            aria-hidden
            className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[var(--shape-organic-1)]"
            style={{ background: bg, color: tone }}
        >
            {resolvedVariant === "overview-use" ? (
                <>
                    <AsteriskStarburst size={15} className="absolute right-[6px] top-[5px] opacity-75" />
                    <svg viewBox="0 0 44 44" className="relative h-9 w-9" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="22" cy="22" r="12.8" fill="currentColor" opacity="0.11" strokeWidth="1.4" />
                        <path d="M22 8v5M22 31v5M8 22h5M31 22h5M12.1 12.1l3.4 3.4M28.5 28.5l3.4 3.4M31.9 12.1l-3.4 3.4M15.5 28.5l-3.4 3.4" strokeWidth="1.3" opacity="0.85" />
                        <path d="M22 15.5l2.2 4.3 4.8.7-3.5 3.3.8 4.7-4.3-2.2-4.3 2.2.8-4.7-3.5-3.3 4.8-.7Z" fill="currentColor" stroke="none" opacity="0.82" />
                    </svg>
                </>
            ) : resolvedVariant === "overview-avoid" ? (
                <>
                    <PhaseMoon size={28} className="absolute left-[8px] top-[8px] opacity-70" />
                    <MonolineStar size={12} className="absolute right-[7px] top-[8px] opacity-75" />
                    <svg viewBox="0 0 44 44" className="relative h-9 w-9" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="22" cy="22" r="11.4" fill="currentColor" opacity="0.1" strokeWidth="1.4" />
                        <path d="M15 29c5.7-1.2 10.2-5.4 12-11.1" strokeWidth="1.55" opacity="0.85" />
                        <path d="M29 14.5l2 2 2-2M10 31l1.8 1.8 1.8-1.8" strokeWidth="1.25" opacity="0.68" />
                    </svg>
                </>
            ) : resolvedVariant === "overview-next" ? (
                <>
                    <OrbitalPaths size={35} className="absolute inset-[4px] opacity-28" />
                    <svg viewBox="0 0 44 44" className="relative h-9 w-9" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 9l3.6 9.4L35 22l-9.4 3.6L22 35l-3.6-9.4L9 22l9.4-3.6Z" fill="currentColor" opacity="0.15" strokeWidth="1.5" />
                        <path d="M22 12v20M12 22h20" strokeWidth="1.45" opacity="0.75" />
                        <path d="M29.5 14.5l2.8-2.8M31.6 11.4h-4M31.6 11.4v4" strokeWidth="1.35" />
                    </svg>
                </>
            ) : resolvedVariant === "theme-use" ? (
                <svg viewBox="0 0 44 44" className="relative h-9 w-9" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 27l7-10 7 6 8-12" strokeWidth="1.45" opacity="0.72" />
                    <circle cx="11" cy="27" r="2.3" fill="currentColor" stroke="none" />
                    <circle cx="18" cy="17" r="2.1" fill="currentColor" stroke="none" opacity="0.85" />
                    <circle cx="25" cy="23" r="2.1" fill="currentColor" stroke="none" opacity="0.85" />
                    <circle cx="33" cy="11" r="2.4" fill="currentColor" stroke="none" />
                    <path d="M27 31l2.1 1.2 2.1-1.2-1.2 2.1 1.2 2.1-2.1-1.2-2.1 1.2 1.2-2.1Z" fill="currentColor" stroke="none" opacity="0.75" />
                </svg>
            ) : resolvedVariant === "theme-avoid" ? (
                <>
                    <AsteriskStarburst size={12} className="absolute right-[7px] top-[7px] opacity-65" />
                    <svg viewBox="0 0 44 44" className="relative h-9 w-9" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 9c5 3.2 8 3.4 12 3.3-.4 10.2-4 17.2-12 22.7-8-5.5-11.6-12.5-12-22.7 4 .1 7-.1 12-3.3Z" fill="currentColor" opacity="0.11" strokeWidth="1.45" />
                        <path d="M16 25c3.3-1.2 8.7-1.2 12 0M17 18c1.2 1.1 2.4 1.1 3.6 0M23.4 18c1.2 1.1 2.4 1.1 3.6 0" strokeWidth="1.45" opacity="0.78" />
                    </svg>
                </>
            ) : resolvedVariant === "timing-window" ? (
                <>
                    <Sunburst size={34} className="absolute inset-[5px] opacity-30" />
                    <AsteriskStarburst size={12} className="absolute right-[7px] top-[6px] opacity-80" />
                    <svg viewBox="0 0 44 44" className="relative h-9 w-9" fill="none">
                        <circle cx="22" cy="22" r="12.5" fill="currentColor" opacity="0.92" />
                        <path d="M15.5 20.5c1.7 2 3.8 2 5.5 0M23 20.5c1.7 2 3.8 2 5.5 0" stroke="var(--text-primary)" strokeWidth="1.65" strokeLinecap="round" opacity="0.72" />
                        <path d="M16.5 27c3.1 3 7.9 3 11 0" stroke="var(--text-primary)" strokeWidth="1.8" strokeLinecap="round" opacity="0.72" />
                        <path d="M13 31c5.3 3.5 12.7 3.5 18 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.26" />
                    </svg>
                </>
            ) : resolvedVariant === "timing-watch" ? (
                <>
                    <MonolineStar size={13} className="absolute right-[7px] top-[7px] opacity-75" />
                    <PhaseMoon size={27} className="absolute left-[9px] top-[9px] opacity-90" />
                    <svg viewBox="0 0 44 44" className="relative h-9 w-9" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 30c3.8 2 8.4 1.4 11.8-1.7" strokeWidth="1.6" opacity="0.45" />
                        <path d="M29.5 14.5l2 2 2-2M9.5 29.5l1.7 1.7 1.7-1.7" strokeWidth="1.35" opacity="0.72" />
                    </svg>
                </>
            ) : (
                <>
                    <OrbitalPaths size={36} className="absolute inset-[4px] opacity-36" />
                    <AbstractSaturn size={31} className="absolute inset-[6.5px] opacity-85" />
                    <svg viewBox="0 0 44 44" className="relative h-9 w-9" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="22" cy="22" r="6.5" fill="currentColor" opacity="0.18" strokeWidth="1.4" />
                        <path d="M10.5 24c5.6-4.1 17.4-5.4 23-2.5" strokeWidth="1.7" opacity="0.82" />
                        <path d="M12.5 28.5c5.8 2 13.8.9 19-2.4" strokeWidth="1.3" opacity="0.5" />
                        <circle cx="31.5" cy="14.5" r="1.9" fill="currentColor" stroke="none" />
                    </svg>
                </>
            )}
        </span>
    );
}

export function ReadingCopyBlock({
    lead,
    intro,
    guideRows,
    wide,
    maxSentences = 3,
    accent = "var(--color-y2k-blue)",
    autoEmphasis = true,
    allowBold = true,
    preserveGuideLabels = false,
}: {
    lead?: string;
    intro?: string;
    guideRows?: ReadingGuideRow[];
    wide?: boolean;
    maxSentences?: number;
    accent?: string;
    autoEmphasis?: boolean;
    allowBold?: boolean;
    preserveGuideLabels?: boolean;
}) {
    const structured = structureReadingCopy({ lead, intro, guideRows, maxSentences, preserveGuideLabels });
    if (!structured.paragraphs.length && !structured.guideRows.length) return null;
    const bodyStyle: CSSProperties = {
        fontFamily: FONT_BODY,
        fontSize: "clamp(16px, 1.15vw, 18px)",
        lineHeight: 1.65,
        color: "var(--text-primary)",
        fontWeight: 400,
        maxWidth: wide ? "100%" : "86ch",
        width: "100%",
        margin: 0,
    };

    return (
        <div
            className={wide ? "mb-[clamp(30px,3.5vw,44px)] border-l-4 pl-[clamp(18px,2.4vw,28px)]" : "mb-[clamp(24px,3vw,36px)]"}
            style={wide ? { borderColor: accent } : undefined}
        >
            <div className="flex flex-col gap-3">
                {structured.paragraphs.map((paragraph, index) => (
                    <p key={index} className="m-0 [text-wrap:pretty]" style={bodyStyle}>
                        <RichText autoEmphasis={autoEmphasis} allowBold={allowBold}>{paragraph}</RichText>
                    </p>
                ))}
            </div>
            <ReadingGuideRows rows={structured.guideRows} accent={accent} autoEmphasis={autoEmphasis} allowBold={allowBold} preserveLabels={preserveGuideLabels} />
        </div>
    );
}

export function RichTextNode({ children }: { children: ReactNode }) {
    return typeof children === "string" ? <RichText>{children}</RichText> : <>{children}</>;
}
