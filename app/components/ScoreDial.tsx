"use client";

interface Props {
    score: number;
    /** Diameter in px. Default 160. Don't go below 120 — typography breaks. */
    size?: number;
    /** Optional label below the number. Default "/ 100 overall". */
    label?: string;
}

export default function ScoreDial({ score, size = 160, label = "/ 100 overall" }: Props) {
    const clamped = Math.max(0, Math.min(100, score));
    const center = size / 2;
    const stroke = Math.max(8, Math.round(size * 0.075));
    const radius = center - stroke - 6;
    const circumference = 2 * Math.PI * radius;
    const arcCircumference = circumference * 0.75;
    const filled = (clamped / 100) * arcCircumference;
    const ring =
        clamped >= 70
            ? "var(--sage)"
            : clamped >= 50
            ? "var(--gold)"
            : "var(--color-spiced-life)";

    return (
        <div style={{ position: "relative", width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="rgba(248,245,236,0.08)"
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${arcCircumference} ${circumference}`}
                    strokeLinecap="round"
                    transform={`rotate(135 ${center} ${center})`}
                />
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={ring}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${filled} ${circumference}`}
                    strokeLinecap="round"
                    transform={`rotate(135 ${center} ${center})`}
                    style={{ filter: `drop-shadow(0 0 8px ${ring}66)`, transition: "stroke-dasharray 0.6s ease" }}
                />
            </svg>
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.1rem",
                }}
            >
                <span
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: `${size * 0.3}px`,
                        fontWeight: 800,
                        color: "var(--color-eggshell)",
                        lineHeight: 1,
                        letterSpacing: "-0.03em",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {Math.round(clamped)}
                </span>
                <span
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: `${Math.max(9, size * 0.055)}px`,
                        letterSpacing: "0.25em",
                        color: "var(--color-acqua)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        textAlign: "center",
                    }}
                >
                    {label}
                </span>
            </div>
        </div>
    );
}
