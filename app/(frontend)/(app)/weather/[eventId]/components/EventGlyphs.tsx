/**
 * EventGlyphs — line-art SVG illustrations for each weather event type.
 * Same style as SignIcon / PlanetIcon: stroke="currentColor", inheritable
 * from CSS. Sized by `size` prop. Designed to read at both small (16px)
 * and hero-watermark (220px) scales.
 */

interface GlyphProps {
    size?: number;
    className?: string;
    strokeWidth?: number;
}

function GlyphRoot({
    size = 24,
    children,
    className,
}: { size?: number; children: React.ReactNode; className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden
        >
            {children}
        </svg>
    );
}

/** Wildfire — three rising flame curves with inner ember accent. */
export function WildfireGlyph({ size, className, strokeWidth = 2 }: GlyphProps) {
    return (
        <GlyphRoot size={size} className={className}>
            {/* Outer flame */}
            <path
                d="M32 54 C 14 54 14 36 22 28 C 22 36 30 36 28 28 C 26 22 32 14 36 8 C 36 18 44 22 46 32 C 48 42 44 54 32 54 Z"
                strokeWidth={strokeWidth}
            />
            {/* Inner flame */}
            <path
                d="M32 48 C 24 48 24 38 28 34 C 28 38 32 38 32 34 C 32 28 36 26 38 22 C 38 28 42 32 42 38 C 42 44 38 48 32 48 Z"
                strokeWidth={strokeWidth * 0.85}
            />
            {/* Ember dot */}
            <circle cx="33" cy="42" r="2" fill="currentColor" stroke="none" />
        </GlyphRoot>
    );
}

/** Flood — three stacked water curves of decreasing length. */
export function FloodGlyph({ size, className, strokeWidth = 2 }: GlyphProps) {
    return (
        <GlyphRoot size={size} className={className}>
            <path
                d="M8 22 Q 16 14 24 22 T 40 22 T 56 22"
                strokeWidth={strokeWidth}
            />
            <path
                d="M8 34 Q 16 26 24 34 T 40 34 T 56 34"
                strokeWidth={strokeWidth}
            />
            <path
                d="M8 46 Q 16 38 24 46 T 40 46 T 56 46"
                strokeWidth={strokeWidth}
            />
            {/* Droplet accent */}
            <path
                d="M32 8 C 28 14 28 18 32 18 C 36 18 36 14 32 8 Z"
                strokeWidth={strokeWidth * 0.85}
                fill="currentColor"
                fillOpacity="0.25"
            />
        </GlyphRoot>
    );
}

/** Storm / cyclone — spiral with motion lines. */
export function StormGlyph({ size, className, strokeWidth = 2 }: GlyphProps) {
    return (
        <GlyphRoot size={size} className={className}>
            {/* Spiral */}
            <path
                d="M40 18 C 26 18 18 28 22 38 C 26 46 36 46 40 38 C 42 34 38 32 36 34 C 34 36 36 38 38 36"
                strokeWidth={strokeWidth}
                fill="none"
            />
            {/* Wind lines */}
            <path d="M8 22 L 22 22" strokeWidth={strokeWidth * 0.85} />
            <path d="M8 32 L 18 32" strokeWidth={strokeWidth * 0.85} />
            <path d="M8 42 L 22 42" strokeWidth={strokeWidth * 0.85} />
            <path d="M44 14 L 56 14" strokeWidth={strokeWidth * 0.85} />
            <path d="M48 52 L 58 52" strokeWidth={strokeWidth * 0.85} />
        </GlyphRoot>
    );
}

/** Earthquake — horizontal seismic crack with epicenter dot. */
export function EarthquakeGlyph({ size, className, strokeWidth = 2 }: GlyphProps) {
    return (
        <GlyphRoot size={size} className={className}>
            {/* Ground line above */}
            <path d="M8 18 L 56 18" strokeWidth={strokeWidth * 0.7} opacity="0.45" />
            {/* Crack pattern */}
            <path
                d="M6 36 L 14 28 L 22 38 L 30 30 L 38 40 L 46 32 L 54 38 L 58 34"
                strokeWidth={strokeWidth}
            />
            {/* Epicenter ring */}
            <circle cx="30" cy="30" r="4" strokeWidth={strokeWidth * 0.85} />
            <circle cx="30" cy="30" r="1.5" fill="currentColor" stroke="none" />
            {/* Ground line below */}
            <path d="M8 50 L 56 50" strokeWidth={strokeWidth * 0.7} opacity="0.45" />
        </GlyphRoot>
    );
}

/** Heatwave — sun with radiating rays + heat shimmer lines. */
export function HeatwaveGlyph({ size, className, strokeWidth = 2 }: GlyphProps) {
    return (
        <GlyphRoot size={size} className={className}>
            <circle cx="32" cy="26" r="8" strokeWidth={strokeWidth} />
            {/* Rays */}
            <path d="M32 10 L 32 14" strokeWidth={strokeWidth} />
            <path d="M48 26 L 52 26" strokeWidth={strokeWidth} />
            <path d="M16 26 L 12 26" strokeWidth={strokeWidth} />
            <path d="M43.3 14.7 L 46 12" strokeWidth={strokeWidth} />
            <path d="M20.7 14.7 L 18 12" strokeWidth={strokeWidth} />
            <path d="M43.3 37.3 L 46 40" strokeWidth={strokeWidth} />
            <path d="M20.7 37.3 L 18 40" strokeWidth={strokeWidth} />
            {/* Heat shimmer below */}
            <path d="M10 48 Q 18 44 26 48 T 42 48 T 54 48" strokeWidth={strokeWidth * 0.85} />
            <path d="M10 56 Q 18 52 26 56 T 42 56 T 54 56" strokeWidth={strokeWidth * 0.85} />
        </GlyphRoot>
    );
}

/** Tornado — descending funnel with rotation lines. */
export function TornadoGlyph({ size, className, strokeWidth = 2 }: GlyphProps) {
    return (
        <GlyphRoot size={size} className={className}>
            {/* Funnel sides */}
            <path d="M14 12 L 24 56" strokeWidth={strokeWidth} />
            <path d="M50 12 L 40 56" strokeWidth={strokeWidth} />
            {/* Top cloud */}
            <path
                d="M10 12 Q 14 6 22 8 Q 28 4 36 8 Q 46 6 54 12 Z"
                strokeWidth={strokeWidth}
            />
            {/* Rotation lines */}
            <path d="M18 22 L 46 22" strokeWidth={strokeWidth * 0.7} opacity="0.7" />
            <path d="M20 32 L 44 32" strokeWidth={strokeWidth * 0.7} opacity="0.7" />
            <path d="M22 42 L 42 42" strokeWidth={strokeWidth * 0.7} opacity="0.7" />
            <path d="M26 52 L 38 52" strokeWidth={strokeWidth * 0.7} opacity="0.7" />
        </GlyphRoot>
    );
}

/** Winter storm — snowflake with drift lines. */
export function WinterStormGlyph({ size, className, strokeWidth = 2 }: GlyphProps) {
    return (
        <GlyphRoot size={size} className={className}>
            {/* Six-pointed snowflake */}
            <g transform="translate(32 28)">
                <path d="M0 -16 L 0 16" strokeWidth={strokeWidth} />
                <path d="M-14 -8 L 14 8" strokeWidth={strokeWidth} />
                <path d="M-14 8 L 14 -8" strokeWidth={strokeWidth} />
                {/* Tips */}
                <path d="M-4 -12 L 0 -16 L 4 -12" strokeWidth={strokeWidth * 0.85} />
                <path d="M-4 12 L 0 16 L 4 12" strokeWidth={strokeWidth * 0.85} />
                <path d="M-12 -10 L -14 -8 L -10 -10" strokeWidth={strokeWidth * 0.85} />
                <path d="M12 10 L 14 8 L 10 10" strokeWidth={strokeWidth * 0.85} />
                <path d="M-12 10 L -14 8 L -10 10" strokeWidth={strokeWidth * 0.85} />
                <path d="M12 -10 L 14 -8 L 10 -10" strokeWidth={strokeWidth * 0.85} />
            </g>
            {/* Drift lines */}
            <path d="M10 54 L 22 54" strokeWidth={strokeWidth * 0.7} opacity="0.55" />
            <path d="M28 58 L 42 58" strokeWidth={strokeWidth * 0.7} opacity="0.55" />
            <path d="M46 54 L 56 54" strokeWidth={strokeWidth * 0.7} opacity="0.55" />
        </GlyphRoot>
    );
}

/** Compound — three overlapping element rings (water/fire/wind). */
export function CompoundGlyph({ size, className, strokeWidth = 2 }: GlyphProps) {
    return (
        <GlyphRoot size={size} className={className}>
            <circle cx="22" cy="26" r="14" strokeWidth={strokeWidth} opacity="0.85" />
            <circle cx="42" cy="26" r="14" strokeWidth={strokeWidth} opacity="0.85" />
            <circle cx="32" cy="42" r="14" strokeWidth={strokeWidth} opacity="0.85" />
            {/* Center dot */}
            <circle cx="32" cy="32" r="2.5" fill="currentColor" stroke="none" />
        </GlyphRoot>
    );
}

export type EventGlyphComponent = (props: GlyphProps) => React.ReactElement;

const EVENT_GLYPH_BY_TYPE: Record<string, EventGlyphComponent> = {
    wildfire:      WildfireGlyph,
    flood:         FloodGlyph,
    storm_cyclone: StormGlyph,
    earthquake:    EarthquakeGlyph,
    heatwave:      HeatwaveGlyph,
    tornado:       TornadoGlyph,
    winter_storm:  WinterStormGlyph,
    compound:      CompoundGlyph,
};

/**
 * Static dispatcher — declared at module scope so React Hooks lint rule
 * `static-components` is satisfied. Looks up the right glyph by event type
 * and renders it. Falls back to CompoundGlyph for unknown types.
 */
export function EventGlyph({ type, ...rest }: { type: string } & GlyphProps) {
    const Component = EVENT_GLYPH_BY_TYPE[type] ?? CompoundGlyph;
    return <Component {...rest} />;
}
