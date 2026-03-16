"use client";

import styles from "../flow/flow.module.css";

/** Renders a markdown table from pipe-delimited text. */
function renderMarkdownTable(tableText: string) {
    const rows = tableText.trim().split("\n").filter((r) => r.trim().startsWith("|"));
    if (rows.length < 2) return null;
    const headerCells = rows[0].split("|").filter((_, i, a) => i > 0 && i < a.length - 1);
    const bodyRows = rows.slice(2);
    return (
        <div className={styles.tableWrap}>
            <table className={styles.readingTable}>
                <thead>
                    <tr>
                        {headerCells.map((cell, ci) => (
                            <th key={ci} dangerouslySetInnerHTML={{ __html: cell.trim().replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {bodyRows.map((row, ri) => {
                        const cells = row.split("|").filter((_, i, a) => i > 0 && i < a.length - 1);
                        return (
                            <tr key={ri}>
                                {cells.map((cell, ci) => (
                                    <td key={ci} dangerouslySetInnerHTML={{ __html: cell.trim().replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/** Renders markdown body text, splitting out tables and bullet lists. */
function renderBody(body: string, sectionKey: string) {
    const parts = body.split(/((?:^|\n)\|.+(?:\n\|.+)*)/m);
    return parts.map((part, pi) => {
        if (part.trim().startsWith("|")) {
            return <div key={`${sectionKey}-t-${pi}`}>{renderMarkdownTable(part)}</div>;
        }
        // Split into blocks (double newline or when list starts/stops)
        const lines = part.split("\n");
        const blocks: { type: "p" | "ul" | "ol"; lines: string[] }[] = [];
        let current: { type: "p" | "ul" | "ol"; lines: string[] } | null = null;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                current = null;
                continue;
            }
            const ulMatch = trimmed.match(/^[\*\-]\s+(.+)/);
            const olMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)/);
            if (ulMatch) {
                if (!current || current.type !== "ul") {
                    current = { type: "ul", lines: [] };
                    blocks.push(current);
                }
                current.lines.push(ulMatch[1]);
            } else if (olMatch) {
                if (!current || current.type !== "ol") {
                    current = { type: "ol", lines: [] };
                    blocks.push(current);
                }
                current.lines.push(olMatch[2]);
            } else {
                if (!current || current.type !== "p") {
                    current = { type: "p", lines: [] };
                    blocks.push(current);
                }
                current.lines.push(trimmed);
            }
        }

        const boldify = (t: string) => t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        return blocks.map((block, bi) => {
            const key = `${sectionKey}-b-${pi}-${bi}`;
            if (block.type === "ul") {
                return (
                    <ul key={key} style={{ margin: "0.5rem 0", paddingLeft: "1.2rem" }}>
                        {block.lines.map((li, li2) => (
                            <li key={li2} dangerouslySetInnerHTML={{ __html: boldify(li) }}
                                style={{ marginBottom: "0.3rem", fontSize: "0.85rem", lineHeight: 1.5 }} />
                        ))}
                    </ul>
                );
            }
            if (block.type === "ol") {
                return (
                    <ol key={key} style={{ margin: "0.5rem 0", paddingLeft: "1.2rem" }}>
                        {block.lines.map((li, li2) => (
                            <li key={li2} dangerouslySetInnerHTML={{ __html: boldify(li) }}
                                style={{ marginBottom: "0.3rem", fontSize: "0.85rem", lineHeight: 1.5 }} />
                        ))}
                    </ol>
                );
            }
            return (
                <p key={key} dangerouslySetInnerHTML={{ __html: boldify(block.lines.join(" ")) }} />
            );
        });
    });
}

interface AIInsightBoxProps {
    readingMap: Record<string, string>;
    sectionKey: string;
    title?: string;
    icon?: string;
}

/** Reusable AI Insight renderer — shows a Gemini-generated section. */
export default function AIInsightBox({ readingMap, sectionKey, title, icon }: AIInsightBoxProps) {
    const body = readingMap[sectionKey];
    if (!body) return null;
    return (
        <div className={styles.aiInsightBox}>
            {title && (
                <div className={styles.readingSectionHeader}>
                    {icon && <span className={styles.readingSectionIcon}>{icon}</span>}
                    <h6 className={styles.readingSectionTitle}>{title}</h6>
                </div>
            )}
            <div className={styles.readingText}>{renderBody(body, sectionKey)}</div>
        </div>
    );
}
