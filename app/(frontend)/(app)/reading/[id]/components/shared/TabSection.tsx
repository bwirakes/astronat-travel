"use client";

import type { ReactNode } from "react";

interface Props {
    kicker: string;
    title: string;
    /** AI-authored outcome-first opener. Rendered as a drop-cap magazine dek
     *  between the H2 title and the body summary. */
    lead?: string;
    /** Plain-English summary or supporting paragraph below the dek. */
    intro?: ReactNode;
    /** When true, intro renders as a wide blue-bordered callout (used by Overview).
     *  When false, intro renders as plain body copy capped at 580px. */
    wideIntro?: boolean;
    titleNoWrap?: boolean;
    children: ReactNode;
}

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";

export function normalizeAiText(text: string): string {
    return text
        .replace(/\s*(?:\*\*)?So what:(?:\*\*)?\s*-\s*(?:\*\*)?Good for:(?:\*\*)?\s*/gi, "\n\nSo what:\n- **Good for:** ")
        .replace(/\s*(?:\*\*)?So what:(?:\*\*)?\s*(?:\*\*)?Good for:(?:\*\*)?\s*/gi, "\n\nSo what:\n- **Good for:** ")
        .replace(/\s*(?:\*\*)?So what:(?:\*\*)?\s*-\s*(?:\*\*)?Use:(?:\*\*)?\s*/gi, "\n\nSo what:\n- **Use:** ")
        .replace(/\s*(?:\*\*)?So what:(?:\*\*)?\s*(?:\*\*)?Use:(?:\*\*)?\s*/gi, "\n\nSo what:\n- **Use:** ")
        .replace(/\s*-\s*(?:\*\*)?Good for:(?:\*\*)?\s*/gi, "\n- **Good for:** ")
        .replace(/\s*(?:\*\*)?Watch:(?:\*\*)?\s*/gi, "\n- **Watch:** ")
        .replace(/\s*-\s*(?:\*\*)?Watch:(?:\*\*)?\s*/gi, "\n- **Watch:** ")
        .replace(/\s*-\s*(?:\*\*)?Use:(?:\*\*)?\s*/gi, "\n- **Use:** ")
        .replace(/\s*-\s*(?:\*\*)?Not for:(?:\*\*)?\s*/gi, "\n- **Not for:** ")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export function splitSoWhat(text: string): { main: string; soWhat: string } {
    const match = text.match(/\s*(?:\*\*)?So what:(?:\*\*)?/i);
    if (!match || typeof match.index !== "number") {
        return { main: text.trim(), soWhat: "" };
    }
    return {
        main: text.slice(0, match.index).trim(),
        soWhat: text.slice(match.index).trim(),
    };
}

export function renderBoldText(text: string): ReactNode[] {
    return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
}

function parseRichText(text: string) {
    const blocks: Array<{ type: "p"; text: string } | { type: "label"; text: string } | { type: "ul"; items: string[] }> = [];
    let paragraph: string[] = [];
    let bullets: string[] = [];

    const flushParagraph = () => {
        if (paragraph.length) {
            blocks.push({ type: "p", text: paragraph.join(" ").trim() });
            paragraph = [];
        }
    };
    const flushBullets = () => {
        if (bullets.length) {
            blocks.push({ type: "ul", items: bullets });
            bullets = [];
        }
    };

    for (const rawLine of text.split(/\n+/)) {
        const line = rawLine.trim();
        if (!line) {
            flushParagraph();
            flushBullets();
            continue;
        }
        if (/^so what:?$/i.test(line)) {
            flushParagraph();
            flushBullets();
            blocks.push({ type: "label", text: "So what:" });
            continue;
        }
        if (/^[-*]\s+/.test(line)) {
            flushParagraph();
            bullets.push(line.replace(/^[-*]\s+/, ""));
            continue;
        }
        flushBullets();
        paragraph.push(line);
    }

    flushParagraph();
    flushBullets();
    return blocks;
}

export function cleanAiCardText(text: string): string {
    const normalized = normalizeAiText(text);
    const parts = splitSoWhat(normalized);
    return parts.main || normalized;
}

function renderDekText(text: string) {
    const blocks = parseRichText(text);

    return blocks.map((block, index) => {
        if (block.type === "label") {
            return (
                <div
                    key={index}
                    className="mt-4 mb-2 text-[11px] uppercase tracking-[0.14em]"
                    style={{ fontFamily: FONT_MONO, color: "var(--color-y2k-blue)", fontWeight: 700 }}
                >
                    {block.text}
                </div>
            );
        }
        if (block.type === "ul") {
            return (
                <ul
                    key={index}
                    className="m-0 mt-2 grid gap-2 p-0 list-none"
                    style={{
                        fontFamily: FONT_BODY,
                        fontSize: "clamp(15px, 1.05vw, 17px)",
                        lineHeight: 1.5,
                        color: "var(--text-primary)",
                    }}
                >
                    {block.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="grid grid-cols-[10px_1fr] gap-3 items-start">
                            <span
                                aria-hidden
                                className="mt-[0.72em] h-[5px] w-[5px] rounded-full"
                                style={{ background: "var(--color-y2k-blue)" }}
                            />
                            <span>{renderBoldText(item)}</span>
                        </li>
                    ))}
                </ul>
            );
        }

        const body = block.text;

        return (
            <p
                key={index}
                className={`[text-wrap:pretty] ${index === 0 ? "m-0" : "m-0 mt-4"}`}
                style={{
                    fontFamily: FONT_BODY,
                    fontSize: "clamp(16px, 1.18vw, 18px)",
                    lineHeight: 1.58,
                    color: "var(--text-primary)",
                    fontWeight: 400,
                }}
            >
                {renderBoldText(body)}
            </p>
        );
    });
}

/**
 * Shared step container for the V4 reading tabs. Hierarchy:
 *   kicker (mono label) → title (short H2) → lead (drop-cap dek) → intro (body para)
 */
export default function TabSection({ kicker, title, lead, intro, wideIntro, titleNoWrap, children }: Props) {
    // Merge AI lead + summary into a single drop-cap paragraph under the H2.
    // Avoids the "two sentences competing for the same role" issue while
    // preserving the longer explainer copy. If lead and intro happen to be
    // the same string, dedupe so we don't repeat it.
    const leadText = lead?.trim() ?? "";
    const rawIntroText = typeof intro === "string" ? intro.trim() : "";
    const leadParts = splitSoWhat(leadText);
    const introParts = splitSoWhat(rawIntroText);
    const rawDekText = (() => {
        if (leadText && rawIntroText && rawIntroText !== leadText) {
            const main = [leadParts.main, introParts.main].filter(Boolean).join(" ");
            const soWhat = leadParts.soWhat || introParts.soWhat;
            return [main, soWhat].filter(Boolean).join("\n\n");
        }
        return leadText || rawIntroText;
    })();
    const dekText = normalizeAiText(rawDekText);
    const showDek = dekText.length > 0;
    // Non-string intro nodes (rare — not used in current tabs) still render
    // through the wide-intro callout if explicitly requested.
    const showIntroNode =
        !!intro && typeof intro !== "string" && !leadText;

    return (
        <section className="px-0 py-4 sm:py-5">
            <div className="w-full max-w-none m-0">
                <div
                    className="text-[11px] tracking-[0.22em] uppercase mb-3"
                    style={{ fontFamily: FONT_MONO, color: "var(--color-y2k-blue)" }}
                >
                    {kicker}
                </div>
                <h2
                    className={`font-normal leading-[1.05] tracking-[-0.02em] m-0 mb-4 max-w-[28ch] ${titleNoWrap ? "[text-wrap:balance] sm:whitespace-nowrap sm:[text-wrap:normal]" : "[text-wrap:balance]"}`}
                    style={{
                        fontFamily: FONT_PRIMARY,
                        fontSize: "clamp(28px, 3.4vw, 44px)",
                        color: "var(--text-primary)",
                    }}
                >
                    {title}
                </h2>
                {showDek && (
                    <div className="mb-[clamp(22px,2.8vw,34px)] w-full">
                        {renderDekText(dekText)}
                    </div>
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
                            {intro}
                        </p>
                    ) : (
                        <p
                            className="text-[16px] leading-[1.6] font-light max-w-[60ch] [text-wrap:pretty] m-0 mb-9"
                            style={{ fontFamily: FONT_BODY, color: "var(--text-secondary)" }}
                        >
                            {intro}
                        </p>
                    )
                )}
                {children}
            </div>
        </section>
    );
}
