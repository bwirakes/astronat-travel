"use client";

import { useState } from "react";

export type IngressPanelRow = {
    city: string;
    icSign: string;
    eventType: string;
    hits: string[];
    hot: boolean;
};

export type IngressPanelData = {
    id: string;
    buttonLabel: string;
    meta: string;
    rows: IngressPanelRow[];
};

const inactiveButtonStyle = {
    fontSize: "10px",
    padding: "3px 8px",
    background: "#111",
    border: "1px solid #333",
    color: "#888",
    borderRadius: "3px",
    cursor: "pointer",
};

const activeButtonStyle = {
    ...inactiveButtonStyle,
    background: "#1a2a3a",
    border: "1px solid #2a4a6a",
    color: "#7eb8f7",
};

export function IngressTabs({ panels }: { panels: IngressPanelData[] }) {
    const [activeId, setActiveId] = useState(panels[0]?.id ?? "");

    return (
        <>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }} id="ingress-tab-btns">
                {panels.map((panel) => {
                    const active = panel.id === activeId;
                    return (
                        <button
                            className={`itab${active ? " active" : ""}`}
                            id={`btn-${panel.id}`}
                            key={panel.id}
                            onClick={() => setActiveId(panel.id)}
                            style={active ? activeButtonStyle : inactiveButtonStyle}
                            type="button"
                        >
                            {panel.buttonLabel}
                        </button>
                    );
                })}
            </div>

            {panels.map((panel) => (
                <div className="ingress-panel" id={panel.id} key={panel.id} style={{ display: panel.id === activeId ? "block" : "none" }}>
                    <div style={{ fontSize: 10, color: "#888", marginBottom: 5 }}>{panel.meta}</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                        <tbody>
                            <tr style={{ background: "#0f1a22", color: "#7eb8f7", textAlign: "left" }}>
                                <th style={{ padding: "3px 6px" }}>City</th>
                                <th style={{ padding: "3px 6px" }}>IC Sign [Mode]</th>
                                <th style={{ padding: "3px 6px" }}>Event Type Forecast</th>
                                <th style={{ padding: "3px 6px" }}>Planetary Hits (≤5°)</th>
                            </tr>
                            {panel.rows.map((row, index) => (
                                <tr key={`${panel.id}-${row.city}`} style={{ background: index % 2 === 0 ? "#0a0f14" : "#0c1118" }}>
                                    <td style={{ padding: "3px 6px", color: row.hot ? "#e08080" : "#ccc" }}>{row.city}</td>
                                    <td style={{ padding: "3px 6px", color: "#f0d070" }}>{row.icSign}</td>
                                    <td style={{ padding: "3px 6px", color: "#aaa" }}>{row.eventType}</td>
                                    <td style={{ padding: "3px 6px", color: row.hot ? "#e08080" : "#7eb8f7" }}>{row.hits.join(", ")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>⚡ = orb ≤1°. Rows are computed from the Postgres ephemeris for the ingress date.</div>
                </div>
            ))}
        </>
    );
}
