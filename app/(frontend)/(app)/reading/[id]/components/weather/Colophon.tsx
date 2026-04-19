"use client";

interface Props {
    cityLabel: string;
    lat?: number;
    lon?: number;
    generated?: string; // ISO
    windowDays: number;
    endDate: string;
}

function fmtGenerated(iso?: string): string {
    if (!iso) return "—";
    try {
        const dt = new Date(iso);
        return dt.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
        });
    } catch {
        return iso;
    }
}

function fmtReReadHint(endDate: string): string {
    // "read again in september" — based on end date + 2 months.
    const dt = new Date(endDate);
    dt.setUTCMonth(dt.getUTCMonth() + 2);
    return `read again in ${dt.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" })}`;
}

export function Colophon({ cityLabel, lat, lon, generated, windowDays, endDate }: Props) {
    const coordsLabel =
        lat != null && lon != null
            ? `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? "N" : "S"} · ${Math.abs(lon).toFixed(4)}°${lon >= 0 ? "E" : "W"}`
            : null;

    return (
        <footer
            style={{
                padding: "clamp(3rem, 6vw, 5rem) 0 clamp(2rem, 4vw, 3rem)",
                borderTop: "1px solid var(--surface-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: "2rem",
                flexWrap: "wrap",
            }}
        >
            <div style={{ maxWidth: "520px" }}>
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.62rem",
                        letterSpacing: "0.28em",
                        color: "var(--gold)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                    }}
                >
                    Colophon
                </div>
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.88rem",
                        lineHeight: 1.6,
                        color: "var(--text-secondary)",
                        margin: "0.9rem 0 0",
                        fontWeight: 300,
                    }}
                >
                    Calculated for {cityLabel}
                    {coordsLabel && <> · {coordsLabel}</>}. Ephemeris DE440. {windowDays}-day window generated {fmtGenerated(generated)}. Set again when you come home.
                </p>
            </div>

            <div>
                <span
                    style={{
                        fontFamily: "var(--font-display-alt-2)",
                        fontSize: "clamp(2.25rem, 4vw, 3rem)",
                        color: "var(--color-spiced-life)",
                        lineHeight: 1,
                        letterSpacing: 0,
                    }}
                >
                    {fmtReReadHint(endDate)}
                </span>
            </div>
        </footer>
    );
}
