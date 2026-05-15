"use client";

import type { CSSProperties, ReactNode } from "react";

export type ReadingGuideLabel = "Best Used For" | "Move Carefully With" | "Your Next Move";

export interface ReadingGuideRow {
    label: ReadingGuideLabel | string;
    body: string;
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
    if (clean.includes("move carefully") || clean.includes("watch") || clean.includes("avoid") || clean.includes("not for") || clean.includes("do not force")) {
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
    const normalized = normalizeGuideLabel(label);
    if (normalized === "Best Used For") return "Best For";
    if (normalized === "Move Carefully With") return "Be Careful With";
    return "Do Next";
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
}: {
    lead?: string;
    intro?: string;
    guideRows?: ReadingGuideRow[];
    maxSentences?: number;
}): { paragraphs: string[]; guideRows: ReadingGuideRow[] } {
    const explicitRows = (guideRows ?? [])
        .map((row) => ({
            label: normalizeGuideLabel(row.label),
            body: sentenceLimit(String(row.body ?? ""), 1),
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
export function RichText({ children }: { children: string }) {
    const normalized = children
        .replace(/(^|[^\*])\*([^\*\n][^\*\n]*?)\*(?!\*)/g, "$1$2")
        .replace(/(^|[^_])_([^_\n][^_\n]*?)_(?!_)/g, "$1$2");
    const parts = normalized.split(/(\*\*[^*]+\*\*)/g);
    const renderAutoEmphasis = (text: string, keyPrefix: string) => {
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
}: {
    rows: ReadingGuideRow[];
    accent?: string;
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
                    <span
                        className="block mb-2 text-[10px] tracking-[0.16em] uppercase"
                        style={{ fontFamily: FONT_MONO, color: accent, fontWeight: 700 }}
                    >
                        {displayGuideLabel(row.label)}
                    </span>
                    <span className="flex items-start gap-2">
                        <span
                            aria-hidden
                            className="mt-[0.62em] h-[5px] w-[5px] shrink-0 rounded-full"
                            style={{ background: accent }}
                        />
                        <span
                            className="block text-[14px] leading-[1.55] [text-wrap:pretty]"
                            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                        >
                            <RichText>{row.body}</RichText>
                        </span>
                    </span>
                </li>
            ))}
        </ul>
    );
}

export function ReadingCopyBlock({
    lead,
    intro,
    guideRows,
    wide,
    maxSentences = 3,
    accent = "var(--color-y2k-blue)",
}: {
    lead?: string;
    intro?: string;
    guideRows?: ReadingGuideRow[];
    wide?: boolean;
    maxSentences?: number;
    accent?: string;
}) {
    const structured = structureReadingCopy({ lead, intro, guideRows, maxSentences });
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
                        <RichText>{paragraph}</RichText>
                    </p>
                ))}
            </div>
            <ReadingGuideRows rows={structured.guideRows} accent={accent} />
        </div>
    );
}

export function RichTextNode({ children }: { children: ReactNode }) {
    return typeof children === "string" ? <RichText>{children}</RichText> : <>{children}</>;
}
