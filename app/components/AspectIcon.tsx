/**
 * AspectIcon — crisp geometric SVG glyphs for the 4 major astrological aspects.
 * Rendered as precise SVG shapes, not Unicode characters.
 */

interface AspectIconProps {
    aspect: string;
    size?: number;
    className?: string;
}

type AspectKey = "trine" | "square" | "conjunction" | "sextile" | "opposition";

const ASPECT_COLORS: Record<AspectKey, string> = {
    trine:       "var(--sage)",
    square:      "var(--amber)",
    conjunction: "var(--gold)",
    sextile:     "var(--cyan)",
    opposition:  "var(--accent)",
};

/** SVG inner elements, drawn in a 16x16 viewBox */
const ASPECT_PATHS: Record<AspectKey, string> = {
    // Trine — equilateral triangle △
    trine: `<path d='M8,2 L14.9,14 L1.1,14 Z' stroke='currentColor' stroke-width='1.3' fill='none' stroke-linejoin='round'/>`,
    // Square — perfect square □
    square: `<rect x='2.5' y='2.5' width='11' height='11' stroke='currentColor' stroke-width='1.3' fill='none'/>`,
    // Conjunction — circle with vertical line ☌
    conjunction: `<circle cx='8' cy='9' r='4' stroke='currentColor' stroke-width='1.3' fill='none'/><line x1='8' y1='2' x2='8' y2='5' stroke='currentColor' stroke-width='1.3' stroke-linecap='round'/>`,
    // Sextile — six-pointed star / asterisk ⚹
    sextile: `<line x1='8' y1='1.5' x2='8' y2='14.5' stroke='currentColor' stroke-width='1.3' stroke-linecap='round'/><line x1='1.5' y1='4.75' x2='14.5' y2='11.25' stroke='currentColor' stroke-width='1.3' stroke-linecap='round'/><line x1='14.5' y1='4.75' x2='1.5' y2='11.25' stroke='currentColor' stroke-width='1.3' stroke-linecap='round'/>`,
    // Opposition — two circles connected by a line ☍
    opposition: `<circle cx='3' cy='8' r='2.2' stroke='currentColor' stroke-width='1.2' fill='none'/><circle cx='13' cy='8' r='2.2' stroke='currentColor' stroke-width='1.2' fill='none'/><line x1='5.2' y1='8' x2='10.8' y2='8' stroke='currentColor' stroke-width='1.2' stroke-linecap='round'/>`,
};

function normalizeAspect(aspect: string): AspectKey {
    const lower = aspect?.toLowerCase() ?? "";
    if (lower.includes("trine"))       return "trine";
    if (lower.includes("square"))      return "square";
    if (lower.includes("conj"))        return "conjunction";
    if (lower.includes("sextile"))     return "sextile";
    if (lower.includes("oppos"))       return "opposition";
    return "conjunction";
}

export default function AspectIcon({ aspect, size = 16, className }: AspectIconProps) {
    const key = normalizeAspect(aspect);
    const paths = ASPECT_PATHS[key];
    const color = ASPECT_COLORS[key];

    return (
        <svg
            viewBox="0 0 16 16"
            width={size}
            height={size}
            className={className}
            style={{ color }}
            aria-label={`${key} aspect`}
            role="img"
            dangerouslySetInnerHTML={{ __html: paths }}
        />
    );
}
