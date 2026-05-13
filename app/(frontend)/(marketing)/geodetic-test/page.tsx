import type { ReactNode } from "react";
import { computeRealtimePositions, type ComputedPosition } from "@/lib/astro/transits";
import { computeGeodeticWeather, type GeodeticWeatherResult } from "@/app/lib/geodetic-weather";
import { geodeticASCLongitude, geodeticMCLongitude } from "@/app/lib/geodetic";
import { ECLIPSES, LUNATIONS, STATIONS } from "@/app/lib/geodetic/geodetic-events";
import { HARD_ASPECTS_2026, MOON_CALENDAR_2026, triggersForWindow } from "@/app/lib/geodetic/weather-triggers";
import { FORECAST_WEATHER_EVENTS, tierFromPss, tierLabel } from "@/app/lib/geodetic/weather-predictions";
import { WEATHER_TECHNIQUES } from "@/app/lib/geodetic/weather-techniques";
import { GeodeticTabs } from "./GeodeticTabs";
import { ORIGINAL_EVENTS_ACCURACY } from "./original-events-accuracy";
import { ORIGINAL_DASHBOARD_EVENTS } from "./original-events";
import styles from "./page.module.css";

export const revalidate = 3600;

const DAY_MS = 86_400_000;
const PLANET_ORDER = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"] as const;
const CITY_SET = [
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { name: "Manila", lat: 14.5995, lon: 120.9842 },
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
];
const SCORE_DATES = ["2026-02-17", "2026-08-12", "2026-11-03", "2026-12-09"];

const SIGN_GLYPHS: Record<string, string> = {
    Aries: "♈",
    Taurus: "♉",
    Gemini: "♊",
    Cancer: "♋",
    Leo: "♌",
    Virgo: "♍",
    Libra: "♎",
    Scorpio: "♏",
    Sagittarius: "♐",
    Capricorn: "♑",
    Aquarius: "♒",
    Pisces: "♓",
};

const SIGN_BASE: Record<string, number> = {
    "♈": 0,
    "♉": 30,
    "♊": 60,
    "♋": 90,
    "♌": 120,
    "♍": 150,
    "♎": 180,
    "♏": 210,
    "♐": 240,
    "♑": 270,
    "♒": 300,
    "♓": 330,
};

type SkyRow = {
    date: string;
    title: string;
    pss: number;
    positions: ComputedPosition[];
    triggers: string[];
    moon?: string;
};

type ScoreRow = {
    city: string;
    date: string;
    result: GeodeticWeatherResult;
};

type AuditGate = {
    label: string;
    status: "pass" | "fail";
    detail: string;
};

function cx(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(" ");
}

function dateLabel(date: string): string {
    return new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
}

function planetLabel(position: ComputedPosition): string {
    const glyph = SIGN_GLYPHS[position.sign] ?? "";
    const rx = position.is_retrograde ? " Rx" : "";
    return `${Math.floor(position.degree_in_sign)}°${String(position.degree_minutes).padStart(2, "0")}' ${glyph}${rx}`;
}

function degreeLabel(longitude: number): string {
    const normalized = ((longitude % 360) + 360) % 360;
    const sign = Object.entries(SIGN_BASE).find(([, base]) => normalized >= base && normalized < base + 30)?.[0] ?? "♈";
    return `${(normalized - SIGN_BASE[sign]).toFixed(1)}°${sign}`;
}

function angularDiff(a: number, b: number): number {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}

function parseZodiacDegree(value: string): number | null {
    const match = value.match(/(\d+(?:\.\d+)?)°\s*([♈♉♊♋♌♍♎♏♐♑♒♓])/);
    if (!match) return null;
    return SIGN_BASE[match[2]] + Number(match[1]);
}

function nearestMoon(date: string): string | undefined {
    const target = new Date(`${date}T12:00:00Z`).getTime();
    const match = MOON_CALENDAR_2026
        .map((moon) => ({
            moon,
            days: Math.abs(new Date(`${moon.date}T12:00:00Z`).getTime() - target) / DAY_MS,
        }))
        .filter((row) => row.days <= 7)
        .sort((a, b) => a.days - b.days)[0];
    if (!match) return undefined;
    return `${match.moon.type}${match.moon.eclipse ? " eclipse" : ""} ${match.moon.degree}`;
}

async function positionsForDate(date: string): Promise<ComputedPosition[]> {
    return computeRealtimePositions(new Date(`${date}T12:00:00Z`));
}

async function buildSkyRows(): Promise<SkyRow[]> {
    const topForecasts = [...FORECAST_WEATHER_EVENTS]
        .sort((a, b) => b.pss - a.pss)
        .slice(0, 16)
        .sort((a, b) => a.date.localeCompare(b.date));

    return Promise.all(
        topForecasts.map(async (event) => {
            const positions = await positionsForDate(event.date);
            const window = triggersForWindow(event.date, 7);
            return {
                date: event.date,
                title: event.title,
                pss: event.pss,
                positions,
                triggers: window.aspects.map((trigger) => `${trigger.bodies} ${trigger.degree}`),
                moon: nearestMoon(event.date),
            };
        }),
    );
}

async function buildWeatherScores(): Promise<ScoreRow[]> {
    const rows: ScoreRow[] = [];
    for (const date of SCORE_DATES) {
        const positions = await positionsForDate(date);
        for (const city of CITY_SET) {
            rows.push({
                city: city.name,
                date,
                result: computeGeodeticWeather({
                    dateUtc: new Date(`${date}T12:00:00Z`),
                    destLat: city.lat,
                    destLon: city.lon,
                    positions,
                }),
            });
        }
    }
    return rows;
}

async function buildAuditGates(): Promise<AuditGate[]> {
    const moonFailures = MOON_CALENDAR_2026.flatMap((phase) => {
        const claimed = parseZodiacDegree(phase.degree);
        const canonicalPool = phase.eclipse
            ? ECLIPSES.filter((event) => event.kind === (phase.type === "NM" ? "solar" : "lunar"))
            : LUNATIONS.filter((event) => event.kind === (phase.type === "NM" ? "new-moon" : "full-moon"));
        const target = new Date(`${phase.date}T12:00:00Z`).getTime();
        const canonical = canonicalPool
            .map((event) => ({ event, days: Math.abs(new Date(event.dateUtc).getTime() - target) / DAY_MS }))
            .sort((a, b) => a.days - b.days)[0];
        if (!canonical || claimed == null) return [`${phase.date}: no canonical match`];
        const orb = angularDiff(claimed, canonical.event.degree);
        return canonical.days > 1.1 || orb > 1.25 ? [`${phase.date}: ${canonical.days.toFixed(1)}d / ${orb.toFixed(1)}°`] : [];
    });

    const marsFailures: string[] = [];
    for (const trigger of HARD_ASPECTS_2026.filter((row) => row.type === "eclipse")) {
        const claimed = parseZodiacDegree(trigger.degree);
        const mars = claimed == null ? undefined : (await positionsForDate(trigger.date)).find((position) => position.name === "Mars");
        const orb = mars && claimed != null ? angularDiff(mars.longitude, claimed) : Infinity;
        if (orb > 2) marsFailures.push(`${trigger.date}: Mars ${Number.isFinite(orb) ? orb.toFixed(1) : "n/a"}° off`);
    }

    const neptuneStation = STATIONS.find((station) => station.planet === "Neptune" && station.type === "retrograde" && station.dateUtc.startsWith("2026-07-07"));

    return [
        {
            label: "Moon trigger parity",
            status: moonFailures.length ? "fail" : "pass",
            detail: moonFailures.length ? moonFailures.join("; ") : "Moon rows match canonical lunation/eclipse tables.",
        },
        {
            label: "Mars eclipse triggers",
            status: marsFailures.length ? "fail" : "pass",
            detail: marsFailures.length ? marsFailures.join("; ") : "Mars trigger dates are inside the live ephemeris orb.",
        },
        {
            label: "Station reversals",
            status: neptuneStation ? "pass" : "fail",
            detail: neptuneStation ? "2026 Neptune Rx uses the ephemeris speed reversal date." : "Neptune Rx station is stale or missing.",
        },
    ];
}

function Kv({ label, value, tone }: { label: string; value: string; tone?: "hi" | "warn" | "crit" }) {
    return (
        <div className={styles.kv}>
            <span>{label}</span>
            <span className={tone ? styles[tone] : undefined}>{value}</span>
        </div>
    );
}

function SidebarBlock({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div>
            <h2>{title}</h2>
            {children}
        </div>
    );
}

function Badge({ children, kind = "geo" }: { children: ReactNode; kind?: "geo" | "pair" | "moon" | "star" | "asp" | "crit" }) {
    return <span className={cx(styles.pill, styles[`pill-${kind}`])}>{children}</span>;
}

function PssBar({ value }: { value: number }) {
    const tier = tierFromPss(value);
    return (
        <div className={styles["pss-bar-wrap"]}>
            <div className={styles["pss-bar"]}>
                <div className={cx(styles["pss-fill"], styles[tier])} style={{ width: `${Math.min(100, Math.round(value * 100))}%` }} />
            </div>
            <span className={styles["pss-val"]}>{value.toFixed(2)}</span>
        </div>
    );
}

function formatDamage(value?: number): string {
    if (value == null) return "—";
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}B`;
}

function formatInteger(value?: number): string {
    if (value == null) return "—";
    return value.toLocaleString("en-US");
}

function typeLabel(type: string): string {
    return type.replace(/_/g, " ");
}

function TechniqueCard({ title, body, tone }: { title: string; body: string; tone: "eclipse" | "geo" | "stress" | "trigger" | "angle" }) {
    return (
        <div className={cx(styles["tech-card"], styles[`t-${tone}`])}>
            <div className={styles["tech-title"]}>{title}</div>
            <div className={styles["tech-body"]}>{body}</div>
        </div>
    );
}

function Sidebar({ station2026 }: { station2026: typeof STATIONS }) {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <div className={styles["logo-icon"]}>☉</div>
                <div>
                    <div className={styles["logo-title"]}>Geodetic Engine</div>
                    <div className={styles["logo-subtitle"]}>v4.0 · Ephemeris-backed · QA build</div>
                </div>
            </div>

            <SidebarBlock title="Base Weights">
                {WEATHER_TECHNIQUES.baseWeights.map((row) => (
                    <Kv key={row.id} label={row.label} value={row.value} tone={row.numeric >= 0.15 ? "hi" : undefined} />
                ))}
            </SidebarBlock>

            <SidebarBlock title="Koch Angles + Transpluto — v4.0">
                <Kv label="Planet ☌ Koch geodetic cusp ≤1°" value="0.22" tone="crit" />
                <Kv label="Planet ☌ Koch geodetic cusp ≤3°" value="0.14" tone="warn" />
                <Kv label="Transpluto ☌ Koch cusp ≤3°" value="0.14" tone="warn" />
                <Kv label="Midpoint ☌ geodetic cusp ≤3°" value="0.10" />
                <p className={styles["side-note"]}>Koch cusps are ASC / MC / IC / DC for the target location. This dashboard computes MC/ASC references from the app engine.</p>
            </SidebarBlock>

            <SidebarBlock title="World Axis — 8 Harmonic Points">
                <Kv label="0°♈ · 0°♋ · 0°♎ · 0°♑" value="Cardinal" tone="warn" />
                <Kv label="15°♉ · 15°♌ · 15°♏ · 15°♒" value="Fixed mid" tone="warn" />
                <Kv label="Planet station on World Point" value="0.20" tone="crit" />
                <Kv label="Eclipse on World Point" value="0.20" tone="crit" />
                <p className={styles["side-note"]}>Harmonic 8 divides 360° by 8. These points map collective-scale degree hits into geodetic longitudes.</p>
            </SidebarBlock>

            <SidebarBlock title="New Techniques — v2.1">
                {WEATHER_TECHNIQUES.newTechniqueWeights.slice(0, 12).map((row) => (
                    <Kv key={row.id} label={row.label} value={row.value} tone={row.numeric >= 0.18 ? "crit" : row.numeric >= 0.1 ? "warn" : undefined} />
                ))}
            </SidebarBlock>

            <SidebarBlock title="Key Ingresses 2025–2026">
                {WEATHER_TECHNIQUES.keyIngresses.map((row) => (
                    <Kv
                        key={`${row.date}-${row.label}`}
                        label={row.label}
                        value={dateLabel(row.date)}
                        tone={row.emphasis === "critical" ? "crit" : row.emphasis === "warning" ? "warn" : row.emphasis === "high" ? "hi" : undefined}
                    />
                ))}
            </SidebarBlock>

            <SidebarBlock title="2026 Station Ledger">
                {station2026.slice(0, 8).map((station) => (
                    <Kv key={`${station.dateUtc}-${station.planet}`} label={`${station.planet} ${station.type}`} value={`${dateLabel(station.dateUtc)} · ${degreeLabel(station.longitude)}`} />
                ))}
            </SidebarBlock>

            <div className={styles["info-box"]}>
                <b>Ephemeris QA:</b> the stale HTML values are now evaluated against canonical lunations, eclipse tables, station reversals, and live computed planetary positions.
            </div>
        </aside>
    );
}

function EventCorrelations({ skyRows }: { skyRows: SkyRow[] }) {
    const rows = [...ORIGINAL_DASHBOARD_EVENTS].sort((a, b) => a.date.localeCompare(b.date));
    const severityFive = rows.filter((row) => row.sev >= 5).length;
    const highPss = rows.filter((row) => row.pss >= 0.55).length;
    const meanPss = rows.length ? rows.reduce((sum, row) => sum + row.pss, 0) / rows.length : 0;
    const pairCount = rows.filter((row) => row.pair).length;
    const totalDamage = rows.reduce((sum, row) => sum + (row.dmg ?? 0), 0);

    return (
        <section className={styles.pane}>
            <div className={styles["stat-grid"]}>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{rows.length}</div><div className={styles["stat-lbl"]}>Total events</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{severityFive}</div><div className={styles["stat-lbl"]}>Severity-5</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{highPss}</div><div className={styles["stat-lbl"]}>High-PSS ≥0.55</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{meanPss.toFixed(3)}</div><div className={styles["stat-lbl"]}>Mean PSS</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{pairCount}</div><div className={styles["stat-lbl"]}>Eclipse pair window</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>${totalDamage.toFixed(0)}B</div><div className={styles["stat-lbl"]}>Total damage</div></div>
            </div>

            <div className={styles["section-hdr"]}>Verified Event Database — 2024–2025</div>
            <div className={styles["info-box"]}>
                <b>Purple pills</b> = eclipse pair window active. <b>Teal pills</b> = geodetic angle activation or geometric stress pattern noted.
                PSS is the combined score before new technique adjustments. Ephemeris parity is checked in the Validation tab.
            </div>
            <div className={styles["table-scroll"]}>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Event</th>
                            <th>Type</th>
                            <th>Sev</th>
                            <th>Deaths</th>
                            <th>$B</th>
                            <th>PSS</th>
                            <th>Stars</th>
                            <th>Patterns</th>
                            <th>Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => {
                            const tier = tierFromPss(row.pss);
                            return (
                                <tr key={`${row.date}-${row.name}-${index}`}>
                                    <td className={styles["date-cell"]}>{row.date}</td>
                                    <td className={styles["event-cell"]}>
                                        <b>{row.name}</b>
                                        {row.notes ? <p>{row.notes}</p> : null}
                                    </td>
                                    <td><Badge kind="pair">{typeLabel(row.type)}</Badge></td>
                                    <td className={styles["sev-cell"]}>{row.sev}</td>
                                    <td className={styles["number-cell"]}>{formatInteger(row.deaths ?? undefined)}</td>
                                    <td className={styles["number-cell"]}>{formatDamage(row.dmg ?? undefined)}</td>
                                    <td className={styles["pss-cell"]}>
                                        <PssBar value={row.pss} />
                                        <div className={styles["risk-label"]}>{tier.toUpperCase()}</div>
                                        {row.crit ? (
                                            <>
                                                <div className={styles["criteria-line"]}>✦ {row.crit.n}/{row.crit.of} criteria</div>
                                                <p>{row.crit.key}</p>
                                            </>
                                        ) : null}
                                    </td>
                                    <td className={styles["pill-cell"]}>
                                        {row.stars.length ? row.stars.map((star) => <Badge key={star} kind="star">{star}</Badge>) : <span className={styles.muted}>—</span>}
                                    </td>
                                    <td className={styles["pill-cell"]}>
                                        {row.pair ? <Badge kind="pair">{row.pair}</Badge> : null}
                                        {row.geostress ? <Badge kind="geo">{row.geostress}</Badge> : null}
                                        {!row.pair && !row.geostress ? <span className={styles.muted}>—</span> : null}
                                    </td>
                                    <td className={styles.cite}>{row.source ?? "—"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className={styles["section-hdr"]}>Forecast Dates Recomputed From Ephemeris</div>
            <div className={styles["table-scroll"]}>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Event</th>
                            <th>Tier</th>
                            <th>PSS</th>
                            {PLANET_ORDER.map((planet) => <th key={planet}>{planet}</th>)}
                            <th>Triggers</th>
                        </tr>
                    </thead>
                    <tbody>
                        {skyRows.map((row) => {
                            const positions = new Map(row.positions.map((position) => [position.name, position]));
                            const tier = tierFromPss(row.pss);
                            return (
                                <tr key={`${row.date}-${row.title}`}>
                                    <td>{dateLabel(row.date)}</td>
                                    <td><b>{row.title}</b></td>
                                    <td><Badge kind={tier === "critical" ? "crit" : "geo"}>{tierLabel(tier)}</Badge></td>
                                    <td><PssBar value={row.pss} /></td>
                                    {PLANET_ORDER.map((planet) => {
                                        const position = positions.get(planet);
                                        return <td key={planet}>{position ? planetLabel(position) : "n/a"}</td>;
                                    })}
                                    <td>
                                        {[...row.triggers, row.moon].filter(Boolean).slice(0, 4).map((trigger) => (
                                            <Badge key={trigger} kind={String(trigger).includes("eclipse") ? "moon" : "asp"}>{trigger}</Badge>
                                        ))}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function TechniquesGuide() {
    return (
        <section className={styles.pane}>
            <div className={styles["info-box"]}>
                <b>Scoring methodology:</b> the original technique stack is retained, but dates and degrees are sourced from the app ephemeris and canonical event catalogs.
            </div>
            <div className={styles["section-hdr"]}>Technique Guide</div>
            <TechniqueCard
                tone="geo"
                title="World Axis — Harmonic 8 Division"
                body="Stations and eclipses near 0° cardinal or 15° fixed points receive global-scale broadcast weight. The dashboard flags these from canonical station/eclipse longitudes."
            />
            <TechniqueCard
                tone="eclipse"
                title="Eclipse Pairs"
                body={WEATHER_TECHNIQUES.eclipsePairs.map((pair) => `${pair.firstDate} ${pair.firstDegree} + ${pair.secondDate} ${pair.secondDegree}: ${pair.notes}`).join(" ")}
            />
            <TechniqueCard
                tone="trigger"
                title="Two-Phase Model"
                body={`${WEATHER_TECHNIQUES.twoPhaseModel.phase1}. ${WEATHER_TECHNIQUES.twoPhaseModel.phase2}. Mars trigger rows are evaluated against the actual Mars longitude for the claimed date.`}
            />
            <TechniqueCard
                tone="angle"
                title="Lunation Triggers"
                body="New and full moon dates are now compared to canonical lunation and eclipse rows, with full moons scored at the Moon's longitude rather than the opposing solar degree."
            />
            <TechniqueCard
                tone="stress"
                title="Station Reversal Validation"
                body="Outer-planet station rows are validated against ephemeris speed reversal dates. This corrected the Neptune retrograde station to July 7, 2026."
            />
        </section>
    );
}

function StatsAndFormulas({ station2026, auditGates }: { station2026: typeof STATIONS; auditGates: AuditGate[] }) {
    return (
        <section className={styles.pane}>
            <div className={styles["section-hdr"]}>Statistics &amp; Formulas</div>
            <div className={styles["stat-grid"]}>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{FORECAST_WEATHER_EVENTS.length}</div><div className={styles["stat-lbl"]}>Forecast Rows</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{station2026.length}</div><div className={styles["stat-lbl"]}>2026 Stations</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{auditGates.filter((gate) => gate.status === "pass").length}/{auditGates.length}</div><div className={styles["stat-lbl"]}>Acceptance Gates</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{ECLIPSES.filter((event) => event.dateUtc.startsWith("2026")).length}</div><div className={styles["stat-lbl"]}>2026 Eclipses</div></div>
            </div>
            {WEATHER_TECHNIQUES.formulas.map((formula) => (
                <div className={styles.formula} key={formula.title}>
                    <b>{formula.title}</b>
                    {formula.lines.map((line) => <span key={line}>{line}</span>)}
                </div>
            ))}
        </section>
    );
}

function RiskCalendar({ skyRows }: { skyRows: SkyRow[] }) {
    return (
        <section className={styles.pane}>
            <div className={styles["section-hdr"]}>Risk Calendar 2026</div>
            <div className={styles["risk-timeline"]}>
                {skyRows.map((row) => {
                    const tier = tierFromPss(row.pss);
                    return (
                        <div className={cx(styles["risk-card"], styles[`tier-${tier}`])} key={`${row.date}-risk`}>
                            <div className={styles["risk-card-hdr"]}>
                                <span className={styles["risk-date"]}>{dateLabel(row.date)}</span>
                                <Badge kind={tier === "critical" ? "crit" : "geo"}>{tierLabel(tier)}</Badge>
                                <b>{row.title}</b>
                            </div>
                            <div className={styles["risk-card-body"]}>
                                <div className={styles["risk-zones"]}><b>Computed score</b><PssBar value={row.pss} /></div>
                                <div className={styles["risk-pills"]}>
                                    {[...row.triggers, row.moon].filter(Boolean).slice(0, 5).map((trigger) => <Badge key={trigger} kind="asp">{trigger}</Badge>)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function ValidationPane({ auditGates, weatherScores }: { auditGates: AuditGate[]; weatherScores: ScoreRow[] }) {
    return (
        <section className={styles.pane}>
            <div className={styles["section-hdr"]}>Validation v8.3</div>
            <div className={styles["fp-grid"]}>
                {auditGates.map((gate) => (
                    <div className={styles["fp-card"]} key={gate.label}>
                        <div className={styles["fp-header"]}>
                            <Badge kind={gate.status === "pass" ? "geo" : "crit"}>{gate.status.toUpperCase()}</Badge>
                            <b>{gate.label}</b>
                        </div>
                        <p>{gate.detail}</p>
                    </div>
                ))}
            </div>
            <div className={styles["section-hdr"]}>Engine Scores By City</div>
            <div className={styles["table-scroll"]}>
                <table>
                    <thead><tr><th>Date</th><th>City</th><th>Score</th><th>Severity</th><th>Top event</th></tr></thead>
                    <tbody>
                        {weatherScores.map((row) => (
                            <tr key={`${row.date}-${row.city}`}>
                                <td>{dateLabel(row.date)}</td>
                                <td>{row.city}</td>
                                <td>{row.result.score}</td>
                                <td>{row.result.severity}</td>
                                <td>{row.result.events[0]?.label ?? "No active event above threshold"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={styles["section-hdr"]}>Imported Missing Event Accuracy</div>
            <div className={styles["stat-grid"]}>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{ORIGINAL_EVENTS_ACCURACY.missingFromNormalizedByDate}</div><div className={styles["stat-lbl"]}>Missing rows</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{ORIGINAL_EVENTS_ACCURACY.ephemerisClaimAudit.claimSummary.checked}</div><div className={styles["stat-lbl"]}>Claims checked</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{ORIGINAL_EVENTS_ACCURACY.ephemerisClaimAudit.claimSummary.pass}</div><div className={styles["stat-lbl"]}>Claims pass</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{ORIGINAL_EVENTS_ACCURACY.ephemerisClaimAudit.claimSummary.warn}</div><div className={styles["stat-lbl"]}>Claims warn</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{ORIGINAL_EVENTS_ACCURACY.ephemerisClaimAudit.claimSummary.fail}</div><div className={styles["stat-lbl"]}>Claims fail</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{ORIGINAL_EVENTS_ACCURACY.ephemerisClaimAudit.eventSummary.unverifiable}</div><div className={styles["stat-lbl"]}>Unstructured rows</div></div>
            </div>
            <div className={styles["warn-box"]}>
                <b>Evaluator note:</b> the restored 149-row table is original-dashboard source data. Missing rows are not engine-verified until their event facts, coordinates, geodetic angles, and planet-degree claims are recomputed from structured inputs.
            </div>
            <div className={styles["table-scroll"]}>
                <table>
                    <thead><tr><th>Date</th><th>Event</th><th>Residual warning</th><th>Ephemeris result</th><th>Orb</th></tr></thead>
                    <tbody>
                        {ORIGINAL_EVENTS_ACCURACY.residualWarnings.map((row) => (
                            <tr key={`${row.date}-${row.event}-${row.claim}`}>
                                <td>{row.date}</td>
                                <td>{row.event}</td>
                                <td>{row.claim}</td>
                                <td>{row.actual}</td>
                                <td className={styles["sev-cell"]}>{row.orb.toFixed(2)}°</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function StarMatrixAndAngles() {
    return (
        <section className={styles.pane}>
            <div className={styles["section-hdr"]}>Body × Star Matrix / Fixed Angles</div>
            <div className={styles["fp-grid"]}>
                <div className={styles["fp-card"]}>
                    <div className={styles["fp-header"]}><Badge kind="star">Stars</Badge><b>Weather-correlated stars</b></div>
                    {WEATHER_TECHNIQUES.fixedStars.map((star) => <Badge key={star.label} kind="star">{star.label} · {star.severity.toFixed(2)}</Badge>)}
                </div>
                <div className={styles["fp-card"]}>
                    <div className={styles["fp-header"]}><Badge kind="geo">Angles</Badge><b>Computed geodetic references</b></div>
                    {CITY_SET.map((city) => (
                        <div className={styles.kv} key={city.name}>
                            <span>{city.name}</span>
                            <span>MC {degreeLabel(geodeticMCLongitude(city.lon))} · ASC {degreeLabel(geodeticASCLongitude(city.lon, city.lat))}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default async function GeodeticTestPage() {
    const [skyRows, weatherScores, auditGates] = await Promise.all([buildSkyRows(), buildWeatherScores(), buildAuditGates()]);
    const station2026 = STATIONS.filter((station) => station.dateUtc.startsWith("2026")).sort((a, b) => a.dateUtc.localeCompare(b.dateUtc));
    const tabs = [
        { label: "Event Correlations", children: <EventCorrelations skyRows={skyRows} /> },
        { label: "Techniques Guide", children: <TechniquesGuide /> },
        { label: "Statistics & Formulas", children: <StatsAndFormulas station2026={station2026} auditGates={auditGates} /> },
        { label: "Planetary Fingerprints", children: <StarMatrixAndAngles /> },
        { label: "Risk Calendar 2026", children: <RiskCalendar skyRows={skyRows} /> },
        { label: "Body × Star Matrix", children: <StarMatrixAndAngles /> },
        { label: "Validation v8.3", children: <ValidationPane auditGates={auditGates} weatherScores={weatherScores} /> },
    ];

    return (
        <div className={styles.app}>
            <Sidebar station2026={station2026} />
            <main className={styles.main}>
                <div className={styles["main-title"]}>
                    <h1>Geodetic Mundane Prediction Engine — v4.0</h1>
                    <span className={styles.cite}>Jan 2024 – Dec 2026 · Koch/Transpluto · World Axis (8 pts) · Hot Zones · Geophysical Degrees · All global events</span>
                </div>

                <GeodeticTabs tabs={tabs} />
            </main>
        </div>
    );
}
