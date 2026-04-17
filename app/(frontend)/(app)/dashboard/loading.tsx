export default function DashboardLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text-primary)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "var(--space-3xl) clamp(1.25rem, 3vw, 3rem)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-xl)",
        }}
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <div
          style={{
            height: "clamp(3rem, 8vw, 5rem)",
            width: "min(70%, 24rem)",
            background: "var(--surface-border)",
            borderRadius: "4px",
            opacity: 0.4,
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "var(--space-md)",
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: "12rem",
                background: "var(--surface)",
                border: "1px solid var(--surface-border)",
                borderRadius: "12px",
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
