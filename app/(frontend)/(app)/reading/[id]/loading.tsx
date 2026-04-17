export default function ReadingDetailLoading() {
  return (
    <div className="min-h-screen w-full max-w-full bg-[var(--bg)] text-[var(--text-primary)] font-body px-4 py-8 md:p-12 overflow-x-hidden box-border">
      <div className="relative z-10 max-w-5xl mx-auto flex flex-col gap-10 md:gap-12" aria-busy="true" aria-label="Loading reading">
        <div
          style={{
            height: "1.1rem",
            width: "7rem",
            background: "var(--surface-border)",
            borderRadius: "4px",
            opacity: 0.5,
          }}
        />
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--surface-border)] pb-6">
          <div className="flex flex-col gap-4 w-full md:w-auto">
            <div
              style={{
                height: "1.4rem",
                width: "10rem",
                background: "var(--surface-border)",
                borderRadius: "999px",
                opacity: 0.5,
              }}
            />
            <div
              style={{
                height: "clamp(3rem, 10vw, 6rem)",
                width: "min(80%, 22rem)",
                background: "var(--surface-border)",
                borderRadius: "4px",
                opacity: 0.4,
              }}
            />
          </div>
          <div
            style={{
              height: "4rem",
              width: "min(100%, 12rem)",
              background: "var(--surface-border)",
              borderRadius: "8px",
              opacity: 0.4,
            }}
          />
        </header>
        <section className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: "7rem",
                flex: "1 1 200px",
                background: "var(--surface)",
                border: "1px solid var(--surface-border)",
                borderRadius: "10px",
                opacity: 0.6,
              }}
            />
          ))}
        </section>
        <div
          style={{
            height: "20rem",
            background: "var(--surface)",
            border: "1px solid var(--surface-border)",
            borderRadius: "12px",
            opacity: 0.55,
          }}
        />
      </div>
    </div>
  );
}
