export default function ReadingsLoading() {
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
          maxWidth: "960px",
          margin: "0 auto",
          padding: "var(--space-3xl) clamp(1.25rem, 3vw, 3rem)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-lg)",
        }}
      >
        <div
          aria-hidden
          style={{
            height: "1.6rem",
            width: "6rem",
            background: "var(--surface-border)",
            borderRadius: "4px",
            opacity: 0.5,
          }}
        />
        <div
          aria-hidden
          style={{
            height: "3rem",
            width: "min(60%, 20rem)",
            background: "var(--surface-border)",
            borderRadius: "4px",
            opacity: 0.4,
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "var(--space-md)",
            marginTop: "var(--space-md)",
          }}
          aria-busy="true"
          aria-label="Loading readings"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: "11rem",
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
