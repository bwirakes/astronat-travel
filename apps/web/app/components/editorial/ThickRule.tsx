"use client";

/** Solid 2px horizontal rule in --text-primary. Editorial chapter break.
 *  Extracted from chart/ChartClient for reuse across reading surfaces. */
export default function ThickRule() {
    return <div className="w-full h-[2px] bg-[var(--text-primary)] my-8" />;
}
