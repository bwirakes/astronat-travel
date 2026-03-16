/**
 * PlanetIcon — crisp line-art SVG glyphs for the 10 classical planets.
 * SVG paths generated via Gemini 3.1 Pro, hand-verified for precision.
 * All paths use stroke="currentColor" so color is inherited from CSS.
 */

interface PlanetIconProps {
    planet: string;
    color?: string;
    size?: number;
    className?: string;
}

export const PLANET_PATHS: Record<string, string> = {
    Sun: `<circle cx='10' cy='10' r='6' stroke='currentColor' stroke-width='1.3' fill='none'/><circle cx='10' cy='10' r='0.8' stroke='currentColor' stroke-width='1.3' fill='currentColor'/>`,
    Moon: `<path d='M12.5,4 A6,6 0 1,0 12.5,16 A4.5,4.5 0 1,1 12.5,4 Z' stroke='currentColor' stroke-width='1.3' fill='none' stroke-linejoin='round'/>`,
    Mercury: `<circle cx='10' cy='8.5' r='3.5' stroke='currentColor' stroke-width='1.3' fill='none'/><path d='M10,12 v5 M7.5,14.5 h5 M6.5,3.5 C6.5,6.5 13.5,6.5 13.5,3.5' stroke='currentColor' stroke-width='1.3' fill='none' stroke-linecap='round'/>`,
    Venus: `<circle cx='10' cy='7.5' r='4.5' stroke='currentColor' stroke-width='1.3' fill='none'/><path d='M10,12 v5.5 M7,15 h6' stroke='currentColor' stroke-width='1.3' fill='none' stroke-linecap='round'/>`,
    Mars: `<circle cx='8.5' cy='11.5' r='4.5' stroke='currentColor' stroke-width='1.3' fill='none'/><path d='M11.68,8.32 L16,4 M12,4 h4 v4' stroke='currentColor' stroke-width='1.3' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`,
    Jupiter: `<path d='M5,6 C5,1 12,1 12,6 C12,10 9,10 9,13 H15 M12,5 V17' stroke='currentColor' stroke-width='1.3' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`,
    Saturn: `<path d='M8,3 V12 C8,8 15,8 15,12.5 C15,15.5 12.5,17 10.5,15.5 M5,6 H11' stroke='currentColor' stroke-width='1.3' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`,
    Uranus: `<path d='M5,3 V12 M15,3 V12 M5,7 H15 M10,7 V13' stroke='currentColor' stroke-width='1.3' fill='none' stroke-linecap='round'/><circle cx='10' cy='15.5' r='2.5' stroke='currentColor' stroke-width='1.3' fill='none'/><circle cx='10' cy='15.5' r='0.7' stroke='currentColor' stroke-width='1.3' fill='currentColor'/>`,
    Neptune: `<path d='M4.5,5 V8.5 C4.5,12 15.5,12 15.5,8.5 V5 M10,4 V14.5 M7.5,12 H12.5' stroke='currentColor' stroke-width='1.3' fill='none' stroke-linecap='round'/><circle cx='10' cy='16.5' r='2' stroke='currentColor' stroke-width='1.3' fill='none'/>`,
    Pluto: `<circle cx='10' cy='4.5' r='2' stroke='currentColor' stroke-width='1.3' fill='none'/><path d='M5.5,4.5 A4.5,4.5 0 0,0 14.5,4.5 M10,9 V17 M6.5,13.5 H13.5' stroke='currentColor' stroke-width='1.3' fill='none' stroke-linecap='round'/>`,
};

/** Strip the planet compound name (e.g. "Saturn-Uranus" paran) → first planet */
function normalizePlanet(planet: string): string {
    return planet?.split("-")[0] ?? planet;
}

export default function PlanetIcon({ planet, color, size = 20, className }: PlanetIconProps) {
    const key = normalizePlanet(planet);
    const paths = PLANET_PATHS[key];
    if (!paths) return null;

    return (
        <svg
            viewBox="0 0 20 20"
            width={size}
            height={size}
            className={className}
            style={{ color: color ?? "currentColor" }}
            aria-label={`${key} glyph`}
            role="img"
            dangerouslySetInnerHTML={{ __html: paths }}
        />
    );
}
