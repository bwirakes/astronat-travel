"use client";

import React, { useState } from "react";
import { WORLD_MAP_PATH } from "@/app/components/worldMapPath";
import { SIGN_PATHS } from "@/app/components/SignIcon";
import { GEODETIC_ZONES, projectLon, projectLat, ELEMENT_COLORS } from "../data/geodeticZones";

export default function InteractiveGeodeticWorldMap({ className }: { className?: string }) {
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const isDark = true; // map is typically shown on dark background in marketing

  return (
    <div className={`relative ${className || ""}`}>
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        <defs>
          {GEODETIC_ZONES.map(z => (
            <linearGradient key={z.id} id={`grad-${z.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ELEMENT_COLORS[z.elem].fill} stopOpacity="0.5" />
              <stop offset="100%" stopColor={ELEMENT_COLORS[z.elem].fill} stopOpacity="0.05" />
            </linearGradient>
          ))}
        </defs>

        {/* World Map Landmass */}
        <path
          d={WORLD_MAP_PATH}
          fill={isDark ? "rgba(255,255,255,0.08)" : "rgba(27,27,27,0.12)"}
          stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(27,27,27,0.3)"}
          strokeWidth="0.5"
        />

        {/* Geodetic Zone Bands */}
        {GEODETIC_ZONES.map(z => {
          const x1 = projectLon(z.startLon);
          const width = 1000 / 12; // Each zone is exactly 30 degrees (1/12th of the map)
          const isActive = activeZoneId === z.id;
          const elem = ELEMENT_COLORS[z.elem];

          return (
            <g key={z.id}>
              {/* Zone fill */}
              <rect
                x={x1}
                y={0}
                width={width}
                height={500}
                fill={isActive ? elem.fill.replace("0.15", "0.35") : elem.fill}
                stroke={elem.stroke}
                strokeWidth={isActive ? 1.5 : 0.5}
                strokeDasharray={isActive ? "none" : "4 4"}
                style={{ transition: "all 0.4s ease", cursor: "pointer" }}
                opacity={activeZoneId ? (isActive ? 1 : 0.2) : 0.4}
                onMouseEnter={() => setActiveZoneId(z.id)}
                onMouseLeave={() => setActiveZoneId(null)}
                onClick={() => setActiveZoneId(z.id)}
              />

              {/* Sign glyph at zone center */}
              <g
                transform={`translate(${x1 + width / 2 - 8}, 20)`}
                opacity={activeZoneId ? (isActive ? 1 : 0.1) : 0.2}
                style={{ transition: "opacity 0.4s ease", color: elem.stroke }}
                dangerouslySetInnerHTML={{ __html: SIGN_PATHS[z.sign] }}
              />

              {/* Meridian line at zone start */}
              <line
                x1={x1} y1={0} x2={x1} y2={500}
                stroke={elem.stroke}
                strokeWidth={isActive ? 1.5 : 0.5}
                opacity={activeZoneId ? (isActive ? 0.9 : 0.15) : 0.25}
                style={{ transition: "all 0.4s ease" }}
              />

              {/* Longitude label */}
              <text
                x={x1 + 4}
                y={490}
                fontSize="7"
                fill={elem.stroke}
                fontFamily="var(--font-mono)"
                opacity={activeZoneId ? (isActive ? 0.9 : 0.15) : 0.3}
                style={{ transition: "opacity 0.4s ease" }}
              >
                {z.startLon >= 0 ? `${z.startLon}°E` : `${Math.abs(z.startLon)}°W`}
              </text>
            </g>
          );
        })}

        {/* Equator */}
        <line x1="0" y1={projectLat(0)} x2="1000" y2={projectLat(0)} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="6 4" />
        <text x="4" y={projectLat(0) - 4} fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="var(--font-mono)">EQUATOR</text>

        {/* Tropics */}
        <line x1="0" y1={projectLat(23.5)} x2="1000" y2={projectLat(23.5)} stroke="rgba(201,169,110,0.1)" strokeWidth="0.4" strokeDasharray="3 6" />
        <line x1="0" y1={projectLat(-23.5)} x2="1000" y2={projectLat(-23.5)} stroke="rgba(201,169,110,0.1)" strokeWidth="0.4" strokeDasharray="3 6" />
      </svg>

      {/* Pop-up info card for the hovered/clicked zone */}
      {activeZoneId && (() => {
        const zone = GEODETIC_ZONES.find(z => z.id === activeZoneId);
        if (!zone) return null;
        const elem = ELEMENT_COLORS[zone.elem];

        return (
          <div className="mt-4 md:mt-0 md:absolute md:top-auto md:bottom-8 md:right-8 z-10 pointer-events-none transition-all w-full px-4 md:px-0">
            <div
              className="p-5 backdrop-blur-xl w-full mx-auto md:w-80 shadow-2xl"
              style={{
                background: "rgba(10,10,10,0.85)",
                border: `1px solid ${elem.stroke}`,
                borderRadius: "var(--shape-asymmetric-sm)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="font-primary text-3xl text-white/95">{zone.sign}</div>
                  <div className="text-2xl" style={{ color: elem.stroke }}>{zone.glyph}</div>
                </div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-white/50 text-right">
                  {zone.startLon >= 0 ? `${zone.startLon}°E` : `${Math.abs(zone.startLon)}°W`}<br/>
                  to {zone.startLon + 30 >= 0 ? `${zone.startLon + 30}°E` : `${Math.abs(zone.startLon + 30)}°W`}
                </div>
              </div>
              <div className="font-secondary text-sm italic mb-3" style={{ color: elem.stroke }}>
                {zone.keyword}
              </div>
              <p className="font-body text-xs text-white/80 leading-relaxed mb-3">
                {zone.desc}
              </p>
              <div className="flex flex-wrap gap-1">
                {zone.cities.slice(0, 3).map(city => (
                  <span
                    key={city}
                    className="font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-sm border"
                    style={{ borderColor: elem.stroke, color: elem.stroke, opacity: 0.8 }}
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
