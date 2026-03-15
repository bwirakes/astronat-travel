"use client";

import { useEffect, useRef } from "react";
import { PLANET_COLORS } from "../lib/planet-data";
import styles from "./map.module.css";

interface PlanetLine {
    planet: string;
    angle: string;          // "MC", "IC", "ASC", "DSC", or "Paran"
    distance_km: number;
    orb?: number;
    is_paran?: boolean;
    longitude?: number;     // degrees 0-360 if provided by backend
    latitude?: number;      // for Paran lines
}

interface Props {
    destination: string;
    planetLines: PlanetLine[];
}

/**
 * Convert angle label → which type of line to draw.
 * MC / IC = meridian lines (pole-to-pole at a longitude offset from destination).
 * ASC / DSC = great-circle curves.
 * Paran = horizontal (constant latitude) lines.
 */
function getAngleType(angle: string): "meridian" | "paran" | "asc-dsc" {
    const a = angle.toUpperCase();
    if (a === "MC" || a === "IC") return "meridian";
    if (a === "ASC" || a === "DSC") return "asc-dsc";
    return "paran";
}

export default function AstroMap({ destination, planetLines }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<unknown>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        import("leaflet").then((L) => {
            // Inject leaflet CSS
            if (!document.querySelector('link[href*="leaflet"]')) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }

            if (!mapRef.current) return;

            fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`,
                { headers: { "User-Agent": "AstroNat-Travel-App/1.0" } }
            )
                .then((r) => r.json())
                .then((data) => {
                    const destLat = data?.[0] ? parseFloat(data[0].lat) : 35.68;
                    const destLon = data?.[0] ? parseFloat(data[0].lon) : 139.69;
                    const center: [number, number] = [destLat, destLon];

                    if (!mapRef.current) return;

                    const map = L.map(mapRef.current, {
                        center: [20, 0],     // World center so all global lines are visible
                        zoom: 2,
                        zoomControl: true,
                        worldCopyJump: true,
                        minZoom: 2,
                        maxZoom: 12,
                    });

                    L.tileLayer(
                        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                        {
                            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                            subdomains: "abcd",
                            maxZoom: 12,
                        }
                    ).addTo(map);

                    // Destination marker
                    const destIcon = L.divIcon({
                        className: "",
                        html: `<div style="width:10px;height:10px;border-radius:50%;background:#e85d4a;box-shadow:0 0 8px #e85d4a;"></div>`,
                        iconSize: [10, 10],
                        iconAnchor: [5, 5],
                    });
                    L.marker(center, { icon: destIcon })
                        .addTo(map)
                        .bindPopup(`<strong>${destination}</strong><br>Your destination`);

                    /**
                     * Draw a MC (or IC) planetary line.
                     * MC lines run pole-to-pole at a given longitude.
                     * We calculate the longitude based on the line's distance from the destination.
                     * If the backend provides line.longitude, use that; otherwise derive it.
                     */
                    const drawMeridianLine = (
                        lon: number,
                        color: string,
                        label: string,
                        angle: string,
                        popup: string,
                        dashArray: string
                    ) => {
                        // Draw a polyline from North Pole to South Pole at this longitude
                        const points: [number, number][] = [];
                        for (let lat = 85; lat >= -85; lat -= 10) {
                            points.push([lat, lon]);
                        }
                        const line = L.polyline(points, {
                            color,
                            weight: 1.5,
                            opacity: 0.75,
                            dashArray,
                        }).addTo(map).bindPopup(popup);

                        // Label near the destination latitude
                        const labelLat = Math.max(-80, Math.min(80, destLat + 5));
                        const labelIcon = L.divIcon({
                            className: "",
                            html: `<span style="color:${color};font-size:10px;font-weight:700;letter-spacing:0.05em;background:rgba(0,0,0,0.5);padding:1px 4px;border-radius:3px;">${label} ${angle}</span>`,
                            iconSize: [80, 16],
                            iconAnchor: [40, 8],
                        });
                        L.marker([labelLat, lon], { icon: labelIcon }).addTo(map);

                        return line;
                    };

                    /**
                     * Draw an ASC or DSC great-circle curve.
                     * ASC/DSC lines curve across the globe following the ecliptic plane.
                     * We approximate by drawing a curved geodesic path using multiple
                     * waypoints that simulate the typical ASC line curve shape.
                     * The exact curve depends on the planet's ecliptic longitude,
                     * but without the full ephemeris we approximate using the line's
                     * distance offset from the destination longitude.
                     */
                    const drawAscDscLine = (
                        baseLon: number,
                        color: string,
                        label: string,
                        angle: string,
                        popup: string,
                        dashArray: string
                    ) => {
                        // ASC/DSC lines have a characteristic S-curve shape  
                        // They cross the equator at baseLon and curve towards the poles
                        const isAsc = angle.toUpperCase() === "ASC";
                        const curveFactor = isAsc ? 1 : -1;

                        const points: [number, number][] = [];
                        for (let lat = -80; lat <= 80; lat += 8) {
                            // The longitude shifts as latitude increases (characteristic S-curve)
                            // This approximates the obliquity of the ecliptic (23.5°)
                            const lonOffset = curveFactor * (Math.sin((lat * Math.PI) / 180) * 23.5);
                            points.push([lat, baseLon + lonOffset]);
                        }

                        const line = L.polyline(points, {
                            color,
                            weight: 1.5,
                            opacity: 0.75,
                            dashArray,
                        }).addTo(map).bindPopup(popup);

                        const labelIcon = L.divIcon({
                            className: "",
                            html: `<span style="color:${color};font-size:10px;font-weight:700;letter-spacing:0.05em;background:rgba(0,0,0,0.5);padding:1px 4px;border-radius:3px;">${label} ${angle}</span>`,
                            iconSize: [80, 16],
                            iconAnchor: [40, 8],
                        });
                        L.marker([destLat, baseLon + (curveFactor * Math.sin((destLat * Math.PI) / 180) * 23.5)], { icon: labelIcon }).addTo(map);

                        return line;
                    };

                    /**
                     * Draw a Paran line (constant latitude circle around the globe).
                     * Parans cross at the latitude where two planetary lines intersect,
                     * so they are horizontal + wrap around the globe.
                     */
                    const drawParanLine = (
                        lat: number,
                        color: string,
                        label: string,
                        popup: string
                    ) => {
                        const points: [number, number][] = [];
                        for (let lon = -180; lon <= 180; lon += 10) {
                            points.push([lat, lon]);
                        }
                        L.polyline(points, {
                            color,
                            weight: 1,
                            opacity: 0.55,
                            dashArray: "2 8",
                        }).addTo(map).bindPopup(popup);

                        const labelIcon = L.divIcon({
                            className: "",
                            html: `<span style="color:${color};font-size:10px;font-weight:700;background:rgba(0,0,0,0.5);padding:1px 4px;border-radius:3px;">⊕ ${label}</span>`,
                            iconSize: [90, 16],
                            iconAnchor: [45, 8],
                        });
                        L.marker([lat, destLon + 20], { icon: labelIcon }).addTo(map);
                    };

                    // Draw influence radius circle around destination (subtle)
                    L.circle(center, {
                        radius: 300 * 1000, // 300km radius = moderate influence
                        color: "#ffffff",
                        weight: 0.5,
                        opacity: 0.15,
                        fillOpacity: 0.03,
                        dashArray: "3 8",
                    }).addTo(map);

                    // Draw all planetary lines
                    planetLines.slice(0, 10).forEach((line, idx) => {
                        const color = PLANET_COLORS[line.planet] || "#ffffff";
                        const popup = `<strong>${line.planet} ${line.angle}</strong><br>${line.distance_km} km from ${destination}<br>Orb: ${line.orb ?? "?"}°`;
                        const dashArray = line.is_paran ? "2 6" : "5 4";

                        if (line.is_paran) {
                            // Use destination latitude ± index offset to separate paran lines visually
                            const paranLat = line.latitude ?? destLat + (idx % 3) * 3 - 3;
                            drawParanLine(paranLat, color, `${line.planet} Paran`, popup);
                            return;
                        }

                        // If backend provides exact longitude, use it; otherwise derive from distance_km
                        // The offset is in which direction from destination the line is
                        // We alternate east/west per line index so they don't all stack
                        const lonOffset = (line.distance_km / 111) * (idx % 2 === 0 ? 1 : -1);
                        const lineLon = line.longitude ?? (destLon + lonOffset);
                        // Normalise into -180..180
                        const normLon = ((lineLon + 180) % 360) - 180;

                        const angleType = getAngleType(line.angle);

                        if (angleType === "meridian") {
                            drawMeridianLine(normLon, color, line.planet, line.angle, popup, dashArray);
                        } else {
                            drawAscDscLine(normLon, color, line.planet, line.angle, popup, dashArray);
                        }
                    });

                    mapInstance.current = map;
                })
                .catch(console.error);
        });

        return () => {
            if (mapInstance.current) {
                (mapInstance.current as { remove: () => void }).remove();
                mapInstance.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={mapRef} className={styles.map} aria-label={`Astrocartography map for ${destination}`} />;
}
