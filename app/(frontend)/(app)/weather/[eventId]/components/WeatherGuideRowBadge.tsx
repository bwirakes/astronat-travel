/**
 * WeatherGuideRowBadge — organic-blob badge that mirrors the /reading
 * GuideRowBadge pattern (`var(--shape-organic-1)` + tinted background +
 * inline SVG). Four variants — one per at-a-glance card.
 *
 * Background colour is a 16% tint of the variant's tone over transparent,
 * matching ReadingCopy.tsx exactly so visual hierarchy reads identically
 * across /reading and /weather.
 */

import type { ReactNode } from "react";
import { Calendar, MapPin, Eye } from "lucide-react";
import { EventGlyph } from "./EventGlyphs";

interface BadgeProps {
    tone: string;
    children: ReactNode;
}

function BadgeShell({ tone, children }: BadgeProps) {
    const bg = `color-mix(in oklab, ${tone} 16%, transparent)`;
    return (
        <span
            aria-hidden
            className="relative mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--shape-organic-1,40%_60%_70%_30%_/_40%_50%_60%_50%)]"
            style={{ background: bg, color: tone }}
        >
            {children}
        </span>
    );
}

export function WhenBadge({ tone = "var(--text-tertiary)" }: { tone?: string }) {
    return (
        <BadgeShell tone={tone}>
            <Calendar size={26} strokeWidth={1.6} />
        </BadgeShell>
    );
}

export function TypeBadge({ eventType, tone }: { eventType: string; tone: string }) {
    return (
        <BadgeShell tone={tone}>
            <EventGlyph type={eventType} size={32} strokeWidth={1.6} />
        </BadgeShell>
    );
}

export function WhereBadge({ tone = "var(--color-y2k-blue, #0456fb)" }: { tone?: string }) {
    return (
        <BadgeShell tone={tone}>
            <MapPin size={26} strokeWidth={1.6} />
        </BadgeShell>
    );
}

export function ActionBadge({ tone, isHistorical }: { tone: string; isHistorical: boolean }) {
    if (isHistorical) {
        return (
            <BadgeShell tone={tone}>
                <svg viewBox="0 0 32 32" width={26} height={26} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="16" cy="16" r="13" />
                    <path d="M10 16 L 14 20 L 22 12" />
                </svg>
            </BadgeShell>
        );
    }
    return (
        <BadgeShell tone={tone}>
            <Eye size={26} strokeWidth={1.6} />
        </BadgeShell>
    );
}
