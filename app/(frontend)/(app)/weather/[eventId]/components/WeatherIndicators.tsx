/**
 * WeatherIndicators — three reusable indicator widgets for the event detail
 * page. Each is built around the existing tier system (critical | high |
 * moderate | watch | low) and uses brand color tokens.
 *
 *   <WarningSign tier="critical" />         → NOAA-style warning badge
 *   <SeverityBar pss={0.83} tier="critical" /> → 10-segment fill indicator
 *   <ActionPrompt tier="critical" kind="forecast" /> → action callout
 */

import type { GeodeticRiskTier } from "@/app/lib/geodetic/weather-types";
import { tierAccent } from "@/app/lib/geodetic/weather-predictions";

const FONT_MONO = "var(--font-mono, monospace)";

// ─── Vocabulary tables ────────────────────────────────────────────────────

/** NOAA-style alert words mapped from tier. */
const ALERT_WORDS: Record<GeodeticRiskTier, { word: string; level: string }> = {
    critical: { word: "WARNING",    level: "EXTREME RISK" },
    high:     { word: "WATCH",      level: "HIGH RISK" },
    moderate: { word: "ADVISORY",   level: "MODERATE RISK" },
    watch:    { word: "MONITORING", level: "LOW PRESSURE" },
    low:      { word: "BACKGROUND", level: "MINIMAL" },
};

/** Action verbs by tier × event kind (forecast vs historical). */
const ACTION_BY_TIER: Record<GeodeticRiskTier, { verb: string; help: string }> = {
    critical: { verb: "Watch closely",   help: "Check local news + alerts" },
    high:     { verb: "Pay attention",   help: "Worth following the news" },
    moderate: { verb: "Stay aware",      help: "Background monitoring" },
    watch:    { verb: "Note it",         help: "Low priority right now" },
    low:      { verb: "For reference",   help: "No action needed" },
};

// ─── WarningSign ───────────────────────────────────────────────────────────

interface WarningSignProps {
    tier: GeodeticRiskTier;
    size?: number;
    className?: string;
}

/**
 * NOAA/FEMA-style warning triangle. Filled for critical/high, outlined for
 * moderate/below. Carries the tier color.
 */
export function WarningSign({ tier, size = 18, className }: WarningSignProps) {
    const color = tierAccent(tier);
    const isStrong = tier === "critical" || tier === "high";

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={isStrong ? color : "none"}
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden
            role="presentation"
        >
            {/* Triangle */}
            <path d="M12 3 L 22 20 L 2 20 Z" />
            {/* Exclamation mark — drawn in eggshell for strong tiers, in tier color for weak */}
            <line
                x1="12" y1="9" x2="12" y2="14"
                stroke={isStrong ? "#F8F5EC" : color}
                strokeWidth={2}
            />
            <circle
                cx="12" cy="17.2" r="0.9"
                fill={isStrong ? "#F8F5EC" : color}
                stroke="none"
            />
        </svg>
    );
}

// ─── AlertLabel ────────────────────────────────────────────────────────────

interface AlertLabelProps {
    tier: GeodeticRiskTier;
    compact?: boolean;
}

/** "WARNING / EXTREME RISK" two-line label, NOAA style. */
export function AlertLabel({ tier, compact = false }: AlertLabelProps) {
    const { word, level } = ALERT_WORDS[tier];
    const color = tierAccent(tier);
    return (
        <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span
                style={{
                    fontFamily: FONT_MONO,
                    fontSize: compact ? 10 : 12,
                    letterSpacing: "0.18em",
                    fontWeight: 800,
                    color,
                    textTransform: "uppercase",
                }}
            >
                {word}
            </span>
            {!compact && (
                <span
                    style={{
                        fontFamily: FONT_MONO,
                        fontSize: 10,
                        letterSpacing: "0.16em",
                        color: "var(--text-tertiary)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        marginTop: 2,
                    }}
                >
                    {level}
                </span>
            )}
        </span>
    );
}

export function alertWordFor(tier: GeodeticRiskTier): string {
    return ALERT_WORDS[tier].word;
}

export function alertLevelFor(tier: GeodeticRiskTier): string {
    return ALERT_WORDS[tier].level;
}

// ─── SeverityBar ───────────────────────────────────────────────────────────

interface SeverityBarProps {
    pss: number;
    tier: GeodeticRiskTier;
    segments?: number;
    width?: number;
    /** Render filled segments using `--bg` cutouts (banner use) instead of `--surface-border` (page use). */
    onDark?: boolean;
}

/**
 * 10-segment fill indicator. Battery-style — universally readable.
 * `pss` (0–1) controls the fill count; `tier` controls the color.
 */
export function SeverityBar({
    pss, tier, segments = 10, width, onDark = false,
}: SeverityBarProps) {
    const filled = Math.max(0, Math.min(segments, Math.round(pss * segments)));
    const color = tierAccent(tier);
    const emptyColor = onDark ? "rgba(248,245,236,0.28)" : "var(--surface-border)";
    const fillColor = onDark ? "#F8F5EC" : color;
    return (
        <div
            role="img"
            aria-label={`${(pss * 100).toFixed(0)} of 100`}
            style={{
                display: "inline-flex",
                gap: 2,
                width: width ?? "auto",
            }}
        >
            {Array.from({ length: segments }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        flex: 1,
                        height: 6,
                        minWidth: 4,
                        background: i < filled ? fillColor : emptyColor,
                        borderRadius: 1,
                        transition: "background 0.2s ease",
                    }}
                />
            ))}
        </div>
    );
}

// ─── ActionPrompt ──────────────────────────────────────────────────────────

interface ActionPromptProps {
    tier: GeodeticRiskTier;
    isHistorical?: boolean;
}

/**
 * Small "what should you actually do" callout. For historical events the
 * action collapses to "Historical event — no live action."
 */
export function ActionPrompt({ tier, isHistorical = false }: ActionPromptProps) {
    const color = tierAccent(tier);
    const { verb, help } = ACTION_BY_TIER[tier];
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ActionGlyph tier={tier} isHistorical={isHistorical} color={color} />
                <span
                    style={{
                        fontFamily: "var(--font-secondary)",
                        fontSize: "1.02rem",
                        color: "var(--text-primary)",
                        lineHeight: 1.2,
                    }}
                >
                    {isHistorical ? "Historical record" : verb}
                </span>
            </div>
            <span
                style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.72rem",
                    color: "var(--text-tertiary)",
                    lineHeight: 1.4,
                    paddingLeft: 24,
                }}
            >
                {isHistorical ? "Past event — see outcome below" : help}
            </span>
        </div>
    );
}

/** Small icon for the ActionPrompt — eye for active critical/high, check for historical/low. */
function ActionGlyph({
    tier, isHistorical, color,
}: { tier: GeodeticRiskTier; isHistorical: boolean; color: string }) {
    if (isHistorical) {
        // Checkmark in circle
        return (
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="8" cy="8" r="6.5" />
                <path d="M5 8 L 7.2 10 L 11 6" />
            </svg>
        );
    }
    if (tier === "critical" || tier === "high") {
        // Eye open
        return (
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M1.5 8 C 3 4 5.5 2.5 8 2.5 C 10.5 2.5 13 4 14.5 8 C 13 12 10.5 13.5 8 13.5 C 5.5 13.5 3 12 1.5 8 Z" />
                <circle cx="8" cy="8" r="2.5" />
            </svg>
        );
    }
    // Half-filled circle for moderate/watch
    return (
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 1.5 A 6.5 6.5 0 0 1 8 14.5 Z" fill={color} stroke="none" />
        </svg>
    );
}
