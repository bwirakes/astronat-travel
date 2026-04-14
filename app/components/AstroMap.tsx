"use client";

import { useEffect, useRef } from "react";
import { PLANET_COLORS } from "@/app/lib/planet-data";
import { PLANET_PATHS } from "./PlanetIcon";
import styles from "./map.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanetLine {
    planet: string;
    angle: string;          // "MC", "IC", "ASC", "DSC", or "Paran"
    distance_km?: number;
    orb?: number;
    is_paran?: boolean;
    longitude?: number;     // pre-computed MC geographic longitude (-180..180)
    latitude?: number;      // for Paran lines (degrees)
    ra?: number;            // Right Ascension in degrees (0–360) — preferred
}

interface NatalPlanet {
    planet: string;
    longitude: number;      // ecliptic longitude 0–360°
    ra?: number;            // right ascension 0–360° (more accurate if provided)
    sign?: string;
    house?: number;
}

interface TransitPlanet {
    name: string;
    longitude: number;
    ra?: number;
}

interface Props {
    destination: string;
    planetLines: PlanetLine[];
    /** Real natal planets — used to compute all 40 ACG lines via RAMC */
    natalPlanets?: NatalPlanet[];
    /** Transiting planets for overlay */
    transitPlanets?: TransitPlanet[];
    /** Birth datetime as ISO 8601 UTC string e.g. "1990-11-06T20:00:00Z" */
    birthDateTimeUTC?: string;
    /** Birth longitude in decimal degrees (east positive) */
    birthLon?: number;
    destLat?: number;
    destLon?: number;
}

// ─── Astronomy Helpers ───────────────────────────────────────────────────────

/** Julian Day Number from a UTC Date */
function julianDay(d: Date): number {
    return d.getTime() / 86400000 + 2440587.5;
}

/**
 * Greenwich Mean Sidereal Time in degrees (0–360).
 * IAU 2000 polynomial — same formula used by Swiss Ephemeris.
 */
function computeGMST(utcDate: Date): number {
    const JD = julianDay(utcDate);
    const T = (JD - 2451545.0) / 36525.0;
    const gmst = 280.46061837
        + 360.98564736629 * (JD - 2451545.0)
        + 0.000387933 * T * T
        - (T * T * T) / 38710000.0;
    return ((gmst % 360) + 360) % 360;
}

/**
 * RAMC = Right Ascension of the Midheaven at the birth location.
 * = GMST + birth_longitude (in degrees, east positive).
 */
function computeRAMC(utcDate: Date, birthLonDeg: number): number {
    return ((computeGMST(utcDate) + birthLonDeg) % 360 + 360) % 360;
}

/**
 * Approximate ecliptic-longitude → Right Ascension conversion.
 * tan(RA) = sin(λ)·cos(ε) / cos(λ)   (ecliptic latitude = 0 assumed)
 * Accurate to ~0.5° for planets near the ecliptic.
 */
function eclToRA(eclLon: number, obliquityDeg: number = 23.4393): number {
    const λ = eclLon * (Math.PI / 180);
    const ε = obliquityDeg * (Math.PI / 180);
    const ra = Math.atan2(Math.sin(λ) * Math.cos(ε), Math.cos(λ));
    return ((ra * (180 / Math.PI)) % 360 + 360) % 360;
}

/**
 * Compute geographic MC longitude from RAMC and planet RA.
 * MC_lon = RAMC − planet_RA   (normalised to -180..180)
 */
function mcLonFromRAMC(RAMC: number, planetRA: number): number {
    const raw = RAMC - planetRA;
    return ((raw + 540) % 360) - 180;
}

function computeDec(eclLonDeg: number, eclLatDeg: number = 0): number {
    const λ = eclLonDeg * (Math.PI / 180);
    const β = eclLatDeg * (Math.PI / 180);
    const ε = 23.4393 * (Math.PI / 180);
    const sinDec = Math.sin(β) * Math.cos(ε) + Math.cos(β) * Math.sin(ε) * Math.sin(λ);
    return Math.asin(sinDec) * (180 / Math.PI);
}

/**
 * Compute all 40 ACG lines (4 angles × 10 planets) from natal planets.
 * Uses the correct RAMC − planet_RA formula.
 * When birthDateTimeUTC/birthLon are provided, RAMC is computed precisely.
 * Otherwise falls back to simplified ecliptic approximation.
 */
function computeAllLines(
    natalPlanets: NatalPlanet[],
    birthDateTimeUTC?: string,
    birthLon?: number
): Omit<PlanetLine, "distance_km" | "orb">[] {
    const lines: Omit<PlanetLine, "distance_km" | "orb">[] = [];

    // Compute RAMC if we have the birth time
    let RAMC: number | null = null;
    if (birthDateTimeUTC && birthLon !== undefined) {
        try {
            const utcDate = new Date(birthDateTimeUTC);
            RAMC = computeRAMC(utcDate, birthLon);
        } catch {
            RAMC = null;
            console.warn("[AstroMap] Invalid birthDateTimeUTC, falling back to approximate projection.");
        }
    } else {
        console.warn("[AstroMap] Missing birthDateTimeUTC or birthLon. Map will use an approximate flat projection which is highly inaccurate (±15° error). Please provide full birth data.");
    }

    for (const np of natalPlanets) {
        // Prefer provided RA; otherwise compute from ecliptic longitude
        const planetRA = np.ra !== undefined ? np.ra : eclToRA(np.longitude);
        const planetDec = computeDec(np.longitude);

        let mcLon: number;
        if (RAMC !== null) {
            // Correct formula: MC_lon = RAMC − planet_RA
            mcLon = mcLonFromRAMC(RAMC, planetRA);
        } else {
            // Fallback (less accurate): uses birth RAMC = 0 assumption
            // planet_RA used as proxy for RAMC − planet_RA
            mcLon = ((90 - planetRA + 540) % 360) - 180;
        }

        const icLon = ((mcLon + 180 + 540) % 360) - 180;
        // ASC/DSC cross equator at ±90° from MC
        const ascLon = ((mcLon - 90 + 540) % 360) - 180;
        const dscLon = ((mcLon + 90 + 540) % 360) - 180;

        lines.push(
            { planet: np.planet, angle: "MC",  longitude: mcLon,  is_paran: false, dec: planetDec } as PlanetLine,
            { planet: np.planet, angle: "IC",  longitude: icLon,  is_paran: false, dec: planetDec } as PlanetLine,
            { planet: np.planet, angle: "ASC", longitude: ascLon, is_paran: false, dec: planetDec } as PlanetLine,
            { planet: np.planet, angle: "DSC", longitude: dscLon, is_paran: false, dec: planetDec } as PlanetLine,
        );
    }
    return lines;
}

// ─── Label Builder ────────────────────────────────────────────────────────────

/** Traditional ACG angle abbreviations (matching reference images) */
const ANGLE_ABBR: Record<string, string> = {
    MC: "MC", IC: "IC", ASC: "AC", DSC: "DC",
};

/**
 * Build stacked vertical label HTML matching the ACG reference image:
 *   ♀   ← planet SVG glyph in planet color
 *   MC  ← angle abbr in same color, tiny mono
 * No background pill — just floating text over the map.
 */
function buildLabelHtml(planet: string, angle: string, color: string): string {
    const planetKey = planet?.split("-")[0] || planet;
    const svgPath = PLANET_PATHS[planetKey] || "";
    const abbr = ANGLE_ABBR[angle.toUpperCase()] ?? angle;

    const svgHtml = svgPath
        ? `<svg viewBox="0 0 20 20" width="13" height="13" style="fill:none;stroke:${color};stroke-width:1.5;display:block;flex-shrink:0">${svgPath}</svg>`
        : `<span style="font-size:10px">${planetKey[0]}</span>`;

    return `<div style="display:flex;flex-direction:column;align-items:center;gap:1px;pointer-events:none">
        ${svgHtml}
        <span style="font-size:7px;font-family:'Inter',monospace;font-weight:700;color:${color};letter-spacing:0.04em;line-height:1">${abbr}</span>
    </div>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AstroMap({
    destination,
    planetLines,
    natalPlanets,
    transitPlanets,
    birthDateTimeUTC,
    birthLon,
    destLat: propLat,
    destLon: propLon
}: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<unknown>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        Promise.all([
            import("leaflet"),
            import("leaflet.geodesic"),
        ]).then(([L]) => {
            if (!document.querySelector('link[href*="leaflet"]')) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }

            if (!mapRef.current) return;

            const initMap = (destLatVal: number, destLonVal: number) => {
                if (!mapRef.current || mapInstance.current) return;

                const center: [number, number] = [destLatVal, destLonVal];

                const map = L.map(mapRef.current!, {
                    center: [20, 0],
                    zoom: 2,
                    zoomControl: true,
                    worldCopyJump: false,
                    minZoom: 2,
                    maxZoom: 10,
                });
                mapInstance.current = map;

                // Dark CartoDB tile
                L.tileLayer(
                    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                    {
                        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
                        subdomains: "abcd",
                        maxZoom: 10,
                    }
                ).addTo(map);

                // ── Layer Groups ────────────────────────────────────────────
                const destLayer = L.layerGroup().addTo(map);
                const natalLayer = L.layerGroup().addTo(map);
                const transitLayer = L.layerGroup(); // Default off
                const paranLayer = L.layerGroup().addTo(map);
                const geoZoneLayer = L.layerGroup(); // Default off

                // ── Destination marker ──────────────────────────────────────
                const destIcon = L.divIcon({
                    className: "",
                    html: `<div style="width:10px;height:10px;border-radius:50%;background:#e85d4a;box-shadow:0 0 12px #e85d4a,0 0 4px #e85d4a;"></div>`,
                    iconSize: [10, 10], iconAnchor: [5, 5],
                });
                L.marker(center, { icon: destIcon })
                    .addTo(destLayer)
                    .bindPopup(`<strong>${destination}</strong>`);

                // ── 150-mile influence zone ─────────────────────────────────
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const LG = (L as any);
                if (LG.GeodesicCircle) {
                    new LG.GeodesicCircle(center, {
                        radius: 241_401, steps: 64,
                        color: "#ffffff", weight: 0.6, opacity: 0.15,
                        fill: true, fillColor: "#ffffff", fillOpacity: 0.03,
                        dashArray: "3 8",
                    }).addTo(destLayer);
                }

                // ── Build line set ──────────────────────────────────────────
                // Priority: real natalPlanets + RAMC → all 40 ACG lines computed
                // Fallback: use MOCK_PLANET_LINES which have pre-set longitudes
                let allLines: (PlanetLine | Omit<PlanetLine, "distance_km" | "orb">)[];
                let tLines: Omit<PlanetLine, "distance_km" | "orb">[] = [];

                if (natalPlanets && natalPlanets.length > 0) {
                    allLines = [
                        ...computeAllLines(natalPlanets, birthDateTimeUTC, birthLon),
                        ...planetLines.filter(l => l.is_paran),
                    ];
                } else {
                    allLines = [...planetLines];
                }

                if (transitPlanets && transitPlanets.length > 0) {
                    const mappedTransits = transitPlanets.map(p => ({
                        planet: p.name,
                        longitude: p.longitude,
                        ra: p.ra
                    }));
                    tLines = computeAllLines(mappedTransits, birthDateTimeUTC, birthLon);
                }

                // ── Dash patterns per angle type ────────────────────────────
                const dashPattern: Record<string, string> = {
                    MC: "", IC: "10 5", ASC: "6 3", DSC: "2 5",
                    PARAN: "2 10",
                };

                // Sort: parans last, rest by distance (closest = drawn on top)
                const sorted = [...allLines].sort((a, b) => {
                    if (a.is_paran && !b.is_paran) return 1;
                    if (!a.is_paran && b.is_paran) return -1;
                    return ((a as PlanetLine).distance_km ?? 9999) - ((b as PlanetLine).distance_km ?? 9999);
                });

                // Tier 2B: Proximity Glow on top 3 closest non-paran lines
                const closestLinesSet = new Set(
                    sorted.filter(l => !l.is_paran && (l as PlanetLine).distance_km !== undefined).slice(0, 3)
                );

                sorted.forEach((line) => {
                    const planetKey = line.planet?.split("-")[0] || line.planet;
                    const color = PLANET_COLORS[planetKey] || PLANET_COLORS[line.planet] || "#aaaaaa";
                    const angle = line.angle.toUpperCase();
                    const dash = line.is_paran
                        ? dashPattern.PARAN
                        : (dashPattern[angle] ?? "5 4");

                    const isClosest = closestLinesSet.has(line);
                    const weight = line.is_paran ? 1.0 : (isClosest ? 2.5 : 1.6);
                    const opacity = line.is_paran ? 0.5 : (isClosest ? 1.0 : 0.85);

                    const kmNote = (line as PlanetLine).distance_km !== undefined
                        ? `<br><span style="opacity:0.55;font-size:0.82em">${Math.round((line as PlanetLine).distance_km!)} km from ${destination}</span>`
                        : "";
                    const popup = `<div style="font-family:'Inter',sans-serif">
                        <strong style="color:${color}">${line.planet} ${line.angle}</strong>${kmNote}
                    </div>`;

                    if (line.is_paran) {
                        // ── Paran: constant-latitude ring ───────────────────
                        const paranLat = line.latitude ?? destLatVal;
                        const paranPoints: [number, number][] = [];
                        for (let lon = -180; lon <= 180; lon += 5) {
                            paranPoints.push([paranLat, lon]);
                        }
                        if (LG.Geodesic) {
                            new LG.Geodesic([paranPoints], {
                                steps: 1, color, weight, opacity, dashArray: dash,
                            }).addTo(paranLayer).bindPopup(popup);
                        }
                        // Paran label
                        const pLabel = L.divIcon({
                            className: "",
                            html: buildLabelHtml(`${line.planet} Paran`, "IC", color),
                            iconSize: [20, 24], iconAnchor: [10, 12],
                        });
                        L.marker([paranLat, destLonVal + 20], { icon: pLabel, interactive: false }).addTo(paranLayer);
                        return;
                    }

                    // ── Get line longitude ──────────────────────────────────
                    if ((line as PlanetLine).longitude === undefined) return;
                    const lineLon = ((( (line as PlanetLine).longitude!) + 540) % 360) - 180;

                    // Glow effect class for label if closest
                    const labelHtml = buildLabelHtml(line.planet, angle, color);
                    const styledLabelHtml = isClosest 
                        ? `<div style="filter: drop-shadow(0 0 6px ${color});">${labelHtml}</div>` 
                        : labelHtml;

                    if (angle === "MC" || angle === "IC") {
                        // ── Meridian: pole-to-pole vertical ────────────────
                        if (LG.Geodesic) {
                            new LG.Geodesic([[[85, lineLon], [-85, lineLon]]], {
                                steps: 8, color, weight, opacity, dashArray: dash,
                            }).addTo(natalLayer).bindPopup(popup);
                        } else {
                            const pts: [number, number][] = [];
                            for (let lat = 85; lat >= -85; lat -= 5) pts.push([lat, lineLon]);
                            L.polyline(pts, { color, weight, opacity, dashArray: dash }).addTo(natalLayer).bindPopup(popup);
                        }

                        // Labels at TOP and BOTTOM (like reference image)
                        const mkLabel = (lat: number) => L.divIcon({
                            className: "",
                            html: styledLabelHtml,
                            iconSize: [20, 24], iconAnchor: [10, lat > 0 ? 0 : 24],
                        });
                        L.marker([75, lineLon],  { icon: mkLabel(75),  interactive: false }).addTo(natalLayer);
                        L.marker([-75, lineLon], { icon: mkLabel(-75), interactive: false }).addTo(natalLayer);

                    } else if (angle === "ASC" || angle === "DSC") {
                        // ── ASC/DSC: rigorous spherical hour angle curve ──────
                        // The horizon equation dictates: cos(H) = -tan(φ)*tan(δ)
                        // where H is the local hour angle, φ is latitude, δ is declination.
                        const sign = angle === "ASC" ? -1 : 1;
                        const curvePts: [number, number][] = [];

                        let decRad = 0;
                        if ((line as any).dec !== undefined) {
                            decRad = (line as any).dec * (Math.PI / 180);
                        } else {
                            // Fallback for mock lines - infer declination from RA roughly
                            const obliquity = 23.4393 * (Math.PI / 180);
                            const planetRA = -lineLon * (Math.PI / 180);
                            decRad = Math.atan(Math.sin(planetRA) * Math.tan(obliquity));
                        }

                        for (let latDeg = -75; latDeg <= 75; latDeg += 3) {
                            const φ = latDeg * (Math.PI / 180);
                            const tanPhi_tanDec = Math.tan(φ) * Math.tan(decRad);

                            // Skip if circumpolar (planet never rises or sets at this latitude)
                            if (Math.abs(tanPhi_tanDec) > 1) continue;

                            const H_rad = Math.acos(-tanPhi_tanDec);
                            const H_deg = H_rad * (180 / Math.PI);

                            // ASC longitude = MC - H (planet is east of meridian, rising)
                            // DSC longitude = MC + H (planet is west of meridian, setting)
                            const ptLon = lineLon + sign * H_deg;
                            curvePts.push([latDeg, ((ptLon + 540) % 360) - 180]);
                        }

                        if (curvePts.length > 2) {
                            if (LG.Geodesic) {
                                new LG.Geodesic([curvePts], {
                                    steps: 3, color, weight, opacity, dashArray: dash,
                                }).addTo(natalLayer).bindPopup(popup);
                            } else {
                                L.polyline(curvePts, { color, weight, opacity, dashArray: dash }).addTo(natalLayer).bindPopup(popup);
                            }
                        }

                        // Labels at equator crossing (H = 90°)
                        const equatorLon = lineLon + sign * 90;
                        const eqLon = ((equatorLon + 540) % 360) - 180;
                        const ascLabel = L.divIcon({
                            className: "",
                            html: styledLabelHtml,
                            iconSize: [20, 24], iconAnchor: [10, 12],
                        });
                        L.marker([0, eqLon], { icon: ascLabel, interactive: false }).addTo(natalLayer);

                        // Second label at ±40° lat
                        const midLat = angle === "ASC" ? 40 : -40;
                        const φ2 = midLat * (Math.PI / 180);
                        const tanVal2 = Math.tan(φ2) * Math.tan(decRad);
                        if (Math.abs(tanVal2) <= 1) {
                            const H_deg2 = Math.acos(-tanVal2) * (180 / Math.PI);
                            const midLon = ((lineLon + sign * H_deg2 + 540) % 360) - 180;
                            const midLabel = L.divIcon({
                                className: "",
                                html: styledLabelHtml,
                                iconSize: [20, 24], iconAnchor: [10, 12],
                            });
                            L.marker([midLat, midLon], { icon: midLabel, interactive: false }).addTo(natalLayer);
                        }
                    }
                });

                // ── Geodetic Zones ──────────────────────────────────────────
                const ZODIAC_COLORS = [
                    "rgba(255, 60, 0, 0.05)", "rgba(60, 200, 60, 0.05)", "rgba(100, 200, 255, 0.05)", "rgba(0, 100, 255, 0.05)",
                    "rgba(255, 60, 0, 0.05)", "rgba(60, 200, 60, 0.05)", "rgba(100, 200, 255, 0.05)", "rgba(0, 100, 255, 0.05)",
                    "rgba(255, 60, 0, 0.05)", "rgba(60, 200, 60, 0.05)", "rgba(100, 200, 255, 0.05)", "rgba(0, 100, 255, 0.05)",
                ];
                const ZODIAC_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

                for (let i = 0; i < 12; i++) {
                    const l1 = i * 30;
                    const l2 = l1 + 30;
                    let w = l1 > 180 ? l1 - 360 : l1;
                    let e = l2 > 180 ? l2 - 360 : l2;
                    if (l1 === 330) { w = -30; e = 0; }
                    L.rectangle([[-85, w], [85, e]], {
                        color: "transparent", fillColor: ZODIAC_COLORS[i], fillOpacity: 1, interactive: false
                    }).addTo(geoZoneLayer);

                    const geoLabel = L.divIcon({
                        className: "",
                        html: `<div style="font-size:8px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.1em; text-align:center;">${ZODIAC_NAMES[i]}</div>`,
                        iconSize: [60, 20], iconAnchor: [30, 10],
                    });
                    const midLon = (w + e) / 2;
                    L.marker([0, midLon], { icon: geoLabel, interactive: false }).addTo(geoZoneLayer);
                }

                // ── Layer Control ───────────────────────────────────────────
                const overlayMaps = {
                    "Destination": destLayer,
                    "Natal ACG Lines": natalLayer,
                    "Transit Lines": transitLayer,
                    "Parans": paranLayer,
                    "Geodetic Zones": geoZoneLayer,
                };
                L.control.layers(undefined, overlayMaps, { position: "topright" }).addTo(map);

                // ── Map Legend ───────────────────────────────────────────────
                const Legend = L.Control.extend({
                    options: { position: "bottomleft" as const },
                    onAdd() {
                        const div = L.DomUtil.create("div");
                        div.style.cssText = [
                            "background:rgba(8,8,16,0.82)",
                            "backdrop-filter:blur(8px)",
                            "border:1px solid rgba(255,255,255,0.1)",
                            "border-radius:6px",
                            "padding:8px 12px",
                            "font-family:'Inter',sans-serif",
                            "font-size:10px",
                            "color:rgba(255,255,255,0.7)",
                            "line-height:1.9",
                            "min-width:148px",
                        ].join(";");
                        div.innerHTML = `
                            <div style="font-weight:700;letter-spacing:0.08em;margin-bottom:5px;color:rgba(255,255,255,0.9);font-size:9px">LINE TYPES</div>
                            <div style="display:flex;align-items:center;gap:7px"><svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" stroke="white" stroke-width="1.6"/></svg> MC</div>
                            <div style="display:flex;align-items:center;gap:7px"><svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" stroke="white" stroke-width="1.6" stroke-dasharray="10 5"/></svg> IC</div>
                            <div style="display:flex;align-items:center;gap:7px"><svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" stroke="white" stroke-width="1.6" stroke-dasharray="6 3"/></svg> AC (Asc)</div>
                            <div style="display:flex;align-items:center;gap:7px"><svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" stroke="white" stroke-width="1.6" stroke-dasharray="2 5"/></svg> DC (Dsc)</div>
                            <div style="display:flex;align-items:center;gap:7px"><svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" stroke="white" stroke-width="1.0" stroke-dasharray="2 10"/></svg> Paran</div>
                            <div style="margin-top:5px;padding-top:5px;border-top:1px solid rgba(255,255,255,0.1);font-size:9px;opacity:0.6">⊙ 150 mi influence zone</div>`;
                        return div;
                    },
                });
                new Legend().addTo(map);

                // ── Planet Color Legend ─────────────────────────────────────
                const PlanetLegend = L.Control.extend({
                    options: { position: "bottomright" as const },
                    onAdd() {
                        const div = L.DomUtil.create("div");
                        div.style.cssText = [
                            "background:rgba(8,8,16,0.82)", "backdrop-filter:blur(8px)",
                            "border:1px solid rgba(255,255,255,0.1)", "border-radius:6px",
                            "padding:8px 12px", "font-family:'Inter',sans-serif", "font-size:10px",
                            "max-width:200px", "display:flex", "flex-wrap:wrap", "gap:6px",
                            "margin-bottom:20px"
                        ].join(";");
                        let html = "";
                        const visiblePlanets = Array.from(new Set(allLines.map(l => (l as PlanetLine).planet.split("-")[0])));
                        for (const p of visiblePlanets) {
                            if (!PLANET_COLORS[p]) continue;
                            html += `<div style="display:flex;align-items:center;gap:4px;width:45%;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${PLANET_COLORS[p]};"></span><span style="font-size:9px;color:rgba(255,255,255,0.8)">${p}</span></div>`;
                        }
                        div.innerHTML = html;
                        return div;
                    }
                });
                new PlanetLegend().addTo(map);
            };

            // Geocode destination if no coords provided
            if (propLat !== undefined && propLon !== undefined) {
                initMap(propLat, propLon);
            } else {
                fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`,
                    { headers: { "User-Agent": "AstroNat-Travel-App/1.0" } }
                )
                    .then(r => r.json())
                    .then(data => {
                        const lat = data?.[0] ? parseFloat(data[0].lat) : 35.68;
                        const lon = data?.[0] ? parseFloat(data[0].lon) : 139.69;
                        initMap(lat, lon);
                    })
                    .catch(() => initMap(35.68, 139.69));
            }
        });

        return () => {
            if (mapInstance.current) {
                (mapInstance.current as { remove: () => void }).remove();
                mapInstance.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={mapRef}
            className={styles.map}
            aria-label={`Astrocartography map for ${destination}`}
        />
    );
}
