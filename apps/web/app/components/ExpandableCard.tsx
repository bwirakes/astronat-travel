"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface ExpandableCardProps {
    title: string;
    tag?: string;
    tagClass?: string;
    defaultOpen?: boolean;
    summary?: string;
    description?: string;
    children: React.ReactNode;
    id?: string;
}

export default function ExpandableCard({
    title, tag, tagClass, defaultOpen = false, summary, description, children, id,
}: ExpandableCardProps) {
    const [open, setOpen] = useState(defaultOpen);
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);

    useEffect(() => {
        if (!contentRef.current) return;
        if (open) {
            setHeight(contentRef.current.scrollHeight);
            const timer = setTimeout(() => setHeight(undefined), 320);
            return () => clearTimeout(timer);
        } else {
            setHeight(contentRef.current.scrollHeight);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setHeight(0));
            });
        }
    }, [open]);

    return (
        <div className="card expandable-card" id={id}>
            <button
                className="expandable-header"
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
            >
                <div className="expandable-title-row">
                    {tag && <span className={`expandable-tag ${tagClass || ""}`}>{tag}</span>}
                    <span className="expandable-title">{title}</span>
                </div>
                {!open && summary && (
                    <span className="expandable-summary">{summary}</span>
                )}
                <ChevronDown
                    size={14}
                    className={`expandable-chevron ${open ? "expandable-chevron-open" : ""}`}
                />
            </button>
            <div
                ref={contentRef}
                className="expandable-content"
                style={{
                    height: height !== undefined ? `${height}px` : "auto",
                    overflow: "hidden",
                    transition: "height 0.3s ease",
                }}
            >
                {description && (
                    <p className="expandable-description">{description}</p>
                )}
                {children}
            </div>
        </div>
    );
}

