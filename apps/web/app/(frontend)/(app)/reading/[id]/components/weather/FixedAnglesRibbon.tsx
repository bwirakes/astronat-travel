"use client";

import { formatAngle, type GWFixedAngles } from "@/app/lib/geodetic-weather-types";

export function FixedAnglesRibbon({ label, angles }: { label: string; angles: GWFixedAngles }) {
    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem 1.25rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                color: "var(--color-y2k-blue)",
                textTransform: "uppercase",
                alignItems: "center",
                paddingTop: "0.5rem",
            }}
        >
            <span style={{ color: "var(--text-tertiary)", fontWeight: 700 }}>{label}</span>
            <span>MC {formatAngle(angles.mc)}</span>
            <span>ASC {formatAngle(angles.asc)}</span>
            <span>IC {formatAngle(angles.ic)}</span>
            <span>DSC {formatAngle(angles.dsc)}</span>
        </div>
    );
}
