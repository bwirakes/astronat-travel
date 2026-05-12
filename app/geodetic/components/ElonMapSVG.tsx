import CaseStudyWorldMap from "./CaseStudyWorldMap";

export default function ElonMapSVG({ className }: { className?: string }) {
  return (
    <CaseStudyWorldMap
      className={`case-map-svg ${className || ""}`}
      title="Geodetic equivalent lines - Elon Musk"
      focusLon={10}
      lines={[
        { label: "Mars ~40W", lon: -40, color: "var(--color-spiced-life)" },
        { label: "Saturn ~55E", lon: 55, color: "var(--geo-case-map-neutral-soft)", dash: "7 5", opacity: 0.8 },
        { label: "Sun ~96E", lon: 96, color: "var(--gold)" },
      ]}
      pins={[
        { label: "Pretoria", lat: -25.75, lon: 28.2, color: "var(--geo-case-map-neutral)" },
        { label: "Austin", lat: 30.27, lon: -97.74, color: "var(--color-spiced-life)" },
        { label: "Boca Chica", lat: 25.99, lon: -97.18, color: "var(--color-spiced-life)", align: "right" },
        { label: "Shanghai", lat: 31.23, lon: 121.47, color: "var(--gold)", align: "right" },
        { label: "Gulf region", lat: 24.45, lon: 54.38, color: "var(--geo-case-map-neutral-soft)" },
      ]}
    />
  );
}
