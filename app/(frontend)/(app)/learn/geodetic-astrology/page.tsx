"use client";

import React from "react";
import { WORLD_MAP_PATH } from "@/app/components/worldMapPath";
import { SIGN_PATHS } from "@/app/components/SignIcon";
import { GEODETIC_ZONES, ELEMENT_COLORS, projectLon, projectLat } from "@/app/geodetic/data/geodeticZones";
import {
  LessonShell,
  GuideHeader,
  ProseSection,
  PullQuote,
  RelatedGuides,
  Plate,
  ConceptCard,
  ConceptStack,
  GlossaryTerm,
  getLesson,
  getGuides,
} from "../_components";

// ═══════════════════════════════════════════════════════════════
// MAP COMPONENT
// ═══════════════════════════════════════════════════════════════

function GeodeticWorldMap() {
  return (
    <div style={{ width: "100%", height: "auto", aspectRatio: "1000/500", backgroundColor: "#000" }}>
      <svg
        viewBox="0 0 1000 500"
        style={{ width: "100%", height: "100%" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {GEODETIC_ZONES.map(z => (
            <linearGradient key={z.id} id={`grad-${z.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ELEMENT_COLORS[z.elem].fill} stopOpacity="0.5" />
              <stop offset="100%" stopColor={ELEMENT_COLORS[z.elem].fill} stopOpacity="0.05" />
            </linearGradient>
          ))}
        </defs>

        <path
          d={WORLD_MAP_PATH}
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.5"
        />

        {GEODETIC_ZONES.map(z => {
          const x1 = projectLon(z.startLon);
          const x2 = projectLon(z.startLon + 30);
          const elem = ELEMENT_COLORS[z.elem];

          return (
            <g key={z.id}>
              <rect
                x={Math.min(x1, x2)}
                y={0}
                width={Math.abs(x2 - x1)}
                height={500}
                fill={elem.fill}
                stroke={elem.stroke}
                strokeWidth={0.5}
                strokeDasharray="4 4"
                opacity={0.6}
              />
              <g
                transform={`translate(${(x1 + x2) / 2 - 8}, 20)`}
                opacity={0.4}
                style={{ color: elem.stroke }}
                dangerouslySetInnerHTML={{ __html: SIGN_PATHS[z.sign] }}
              />
              <line
                x1={x1} y1={0} x2={x1} y2={500}
                stroke={elem.stroke}
                strokeWidth={0.5}
                opacity={0.4}
              />
              <text
                x={x1 + 4}
                y={490}
                fontSize="7"
                fill={elem.stroke}
                fontFamily="var(--font-mono)"
                opacity={0.5}
              >
                {z.startLon >= 0 ? `${z.startLon}°E` : `${Math.abs(z.startLon)}°W`}
              </text>
            </g>
          );
        })}

        <line x1="0" y1={projectLat(0)} x2="1000" y2={projectLat(0)} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="6 4" />
        <text x="4" y={projectLat(0) - 4} fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="var(--font-mono)">EQUATOR</text>

        <line x1="0" y1={projectLat(23.5)} x2="1000" y2={projectLat(23.5)} stroke="rgba(201,169,110,0.1)" strokeWidth="0.4" strokeDasharray="3 6" />
        <line x1="0" y1={projectLat(-23.5)} x2="1000" y2={projectLat(-23.5)} stroke="rgba(201,169,110,0.1)" strokeWidth="0.4" strokeDasharray="3 6" />
      </svg>
    </div>
  );
}

export default function GeodeticLessonPage() {
  const lesson = getLesson("geodetic-astrology");

  return (
    <LessonShell lessonId="geodetic-astrology">
      <GuideHeader
        guide={lesson}
        title="Geodetic"
        titleItalic="Astrology"
        lede="Unlike astrocartography, which is personal and calculated from your specific birth data, geodetic astrology is baked into the Earth itself. The same zodiac zone that shapes London shapes every person who has ever lived there, regardless of when they were born. The system is simple: every city on Earth has a permanent, fixed zodiacal frequency."
      />

      <ProseSection id="s01" kicker="§ 01" title="Mundane Astrology">
        <p>
          Geodetic astrology is a form of <GlossaryTerm term="Mundane Astrology">mundane astrology</GlossaryTerm>—the astrology of the world, rather than the individual. It maps the 360 degrees of the zodiac directly onto the 360 degrees of the Earth's longitude. 
        </p>
        <p>
          The prime meridian at Greenwich, England (0° longitude), is mapped to 0° Aries. As you move east, every 30 degrees of longitude shifts into the next zodiac sign. By the time you reach Tokyo (139°E), you are in the sign of Leo. New York (74°W) falls in Aquarius. This creates a permanent, invisible grid over the entire planet.
        </p>

        <Plate number="01" title="The Geodetic World Map">
          <GeodeticWorldMap />
        </Plate>
      </ProseSection>

      <ProseSection id="s02" kicker="§ 02" title="The Twelve Zones">
        <ConceptStack layout="grid">
          {GEODETIC_ZONES.map((zone) => (
            <ConceptCard
              key={zone.id}
              badge={<span style={{ fontFamily: "var(--font-primary)", fontSize: "1.2rem", lineHeight: 1 }}>{zone.glyph}</span>}
              title={zone.sign}
              kicker={zone.startLon >= 0 ? `${zone.startLon}°E — ${zone.startLon + 30}°E` : `${Math.abs(zone.startLon)}°W — ${Math.abs(zone.startLon + 30)}°W`}
              subtitle={zone.keyword}
              meta={[
                { label: "Major Cities", value: zone.cities.join(" · ") }
              ]}
            >
              {zone.desc}
            </ConceptCard>
          ))}
        </ConceptStack>
      </ProseSection>

      <PullQuote attribution="— Astro-Nat">
        Every coordinate on Earth is permanently tuned to a zodiacal frequency. The question is whether that frequency resonates with your chart, or works against it.
      </PullQuote>

      <RelatedGuides
        label="Read next"
        guides={getGuides(["astrocartography", "houses", "viewing-the-stars"])}
      />
    </LessonShell>
  );
}
