import CaseStudyWorldMap from "./CaseStudyWorldMap";

export default function TrumpMapSVG({ className }: { className?: string }) {
  return (
    <CaseStudyWorldMap
      className={`case-map-svg ${className || ""}`}
      title="Geodetic equivalent lines - Donald Trump"
      focusLon={25}
      lines={[
        { label: "Moon ~99W", lon: -99, color: "var(--geo-case-map-moon)" },
        { label: "Sun ~82E", lon: 82, color: "var(--gold)" },
        { label: "Mars ~146E", lon: 146, color: "var(--color-spiced-life)" },
        { label: "Birth 73.8W", lon: -73.8, color: "var(--geo-case-map-neutral-soft)", dash: "6 5", opacity: 0.75 },
      ]}
      pins={[
        { label: "New York", lat: 40.71, lon: -74.01, color: "var(--geo-case-map-neutral)" },
        { label: "Washington DC", lat: 38.9, lon: -77.04, color: "var(--color-y2k-blue)", align: "right" },
        { label: "Mar-a-Lago", lat: 26.68, lon: -80.04, color: "var(--color-acqua)", align: "right" },
        { label: "Moscow", lat: 55.76, lon: 37.62, color: "var(--gold)" },
        { label: "Japan", lat: 35.68, lon: 139.76, color: "var(--color-spiced-life)", align: "right" },
      ]}
    />
  );
}
