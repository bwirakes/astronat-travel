/**
 * SignIcon — crisp line-art SVG glyphs for the 12 zodiac signs.
 * SVG paths hand-coded for precision.
 * All paths use stroke="currentColor" so color is inherited from CSS.
 */

interface SignIconProps {
    sign: string;
    color?: string;
    size?: number;
    className?: string;
}

export const SIGN_PATHS: Record<string, string> = {
    Aries: `<path d='M10,18 V8 M10,8 C10,4 4,4 4,8 M10,8 C10,4 16,4 16,8' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`,
    Taurus: `<circle cx='10' cy='12' r='4' stroke='currentColor' stroke-width='1.5' fill='none'/><path d='M4,5 C4,10 16,10 16,5' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round'/>`,
    Gemini: `<path d='M6,4 V16 M14,4 V16 M4,4 H16 M4,16 H16' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`,
    Cancer: `<circle cx='7' cy='8' r='3' stroke='currentColor' stroke-width='1.5' fill='none'/><circle cx='13' cy='12' r='3' stroke='currentColor' stroke-width='1.5' fill='none'/><path d='M10,8 H17 M3,12 H10' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round'/>`,
    Leo: `<circle cx='6' cy='14' r='2' stroke='currentColor' stroke-width='1.5' fill='none'/><path d='M8,14 C8,10 11,6 14,6 C17,6 17,9 14,9 C11,9 10,12 10,14' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`,
    Virgo: `<path d='M6,6 V14 C6,16 9,16 9,14 V6 M12,6 V14 C12,16 15,16 15,14 V6 M15,14 C15,18 18,18 18,14' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`,
    Libra: `<path d='M5,16 H15 M5,12 C5,8 15,8 15,12 M3,12 H5 M15,12 H17' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`,
    Scorpio: `<path d='M6,6 V14 M10,6 V14 M14,6 V14 L17,17 M14,14 C14,14 17,14 17,11' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`,
    Sagittarius: `<path d='M5,15 L15,5 M10,5 H15 V10 M7,8 L12,13' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`,
    Capricorn: `<path d='M6,5 V15 M6,10 C6,6 11,6 11,10 V15 C11,18 14,18 14,15 C14,12 11,12 11,15' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`,
    Aquarius: `<path d='M4,9 L7,6 L10,9 L13,6 L16,9 M4,14 L7,11 L10,14 L13,11 L16,14' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`,
    Pisces: `<path d='M6,4 C2,10 2,14 6,20 M14,4 C18,10 18,14 14,20 M2,12 H18' stroke='currentColor' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`,
};

export default function SignIcon({ sign, color, size = 16, className }: SignIconProps) {
    const paths = SIGN_PATHS[sign];
    if (!paths) return null;

    return (
        <svg
            viewBox="0 0 20 20"
            width={size}
            height={size}
            className={className}
            style={{ color: color ?? "currentColor" }}
            aria-label={`${sign} glyph`}
            role="img"
            dangerouslySetInnerHTML={{ __html: paths }}
        />
    );
}
