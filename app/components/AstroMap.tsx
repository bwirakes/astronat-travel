"use client";

import { useEffect, useRef } from "react";
import { PLANET_COLORS } from "../lib/planet-data";
import styles from "./map.module.css";

interface PlanetLine {
    planet: string;
    angle: string;
    distance_km: number;
}

interface Props {
    destination: string;
    planetLines: PlanetLine[];
}

// Approximate "draw a line" across a map for each planet line.
// We place a circle at the destination and draw radial lines outward.
export default function AstroMap({ destination, planetLines }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<unknown>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        // Dynamic Leaflet import (client only)
        import("leaflet").then((L) => {
            // Inject leaflet CSS via link tag (avoids TS module resolution issues)
            if (!document.querySelector('link[href*="leaflet"]')) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }

            if (!mapRef.current) return;

            // Geocode destination for map center
            fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`, {
                headers: { "User-Agent": "AstroNat-Travel-App/1.0" },
            })
                .then((r) => r.json())
                .then((data) => {
                    const center: [number, number] = data?.[0]
                        ? [parseFloat(data[0].lat), parseFloat(data[0].lon)]
                        : [0, 0];

                    if (!mapRef.current) return;

                    const map = L.map(mapRef.current, {
                        center,
                        zoom: 4,
                        zoomControl: true,
                    });

                    // Dark tile layer
                    L.tileLayer(
                        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                        {
                            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
                        .bindPopup(`<strong>${destination}</strong><br>Your destination`)
                        .openPopup();

                    // Draw planetary line circles (km → approximate degrees)
                    planetLines.slice(0, 8).forEach((line) => {
                        const color = PLANET_COLORS[line.planet] || "#ffffff";
                        const radiusDeg = line.distance_km / 111; // 1° ≈ 111 km
                        const angles = [0, 45, 90, 135, 180, 225, 270, 315];

                        // Draw a partial arc around the destination to represent the line direction
                        const points: [number, number][] = angles.map((a) => {
                            const rad = (a * Math.PI) / 180;
                            return [
                                center[0] + radiusDeg * Math.cos(rad),
                                center[1] + radiusDeg * Math.sin(rad),
                            ];
                        });
                        points.push(points[0]); // Close the loop

                        L.polyline(points, {
                            color,
                            weight: 1,
                            opacity: 0.6,
                            dashArray: "4 6",
                        })
                            .addTo(map)
                            .bindPopup(
                                `<strong>${line.planet} ${line.angle}</strong><br>${line.distance_km} km away`
                            );

                        // Label at 3 o'clock position
                        const labelPos: [number, number] = [
                            center[0],
                            center[1] + radiusDeg,
                        ];
                        const labelIcon = L.divIcon({
                            className: "",
                            html: `<span style="color:${color};font-size:11px;font-weight:600;white-space:nowrap;">${line.planet}</span>`,
                            iconSize: [60, 14],
                            iconAnchor: [0, 7],
                        });
                        L.marker(labelPos, { icon: labelIcon }).addTo(map);
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
