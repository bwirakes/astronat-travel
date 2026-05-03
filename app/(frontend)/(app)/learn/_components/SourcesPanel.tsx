type Source = {
  author: string;
  title: string;
  year: number | string;
  /** Optional note about why this source is relevant. */
  note?: string;
};

type SourcesPanelProps = {
  /** 2–4 named works. The curriculum plan §3 names one named source per page
   *  as the credibility floor. */
  sources: Source[];
};

/**
 * The "Further reading" block at the bottom of every lesson, just above the
 * PaginationCard. Implements the curriculum plan's R-rule: every lesson cites
 * at least one named human source.
 */
export function SourcesPanel({ sources }: SourcesPanelProps) {
  if (!sources.length) return null;
  return (
    <section className="px-6 md:px-12 lg:px-20 py-16 max-w-7xl mx-auto">
      <div className="border-t border-[var(--surface-border)] pt-10 max-w-4xl">
        <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-60 mb-6">
          Further reading
        </div>
        <ul className="space-y-4">
          {sources.map((s, i) => (
            <li key={i} className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-50 md:w-12 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <div className="font-body text-base md:text-lg">
                  <span className="opacity-90">{s.author}</span>
                  <span className="opacity-40 mx-2">·</span>
                  <span className="italic opacity-90">{s.title}</span>
                  <span className="opacity-50 ml-2 font-mono text-sm">({s.year})</span>
                </div>
                {s.note && (
                  <div className="mt-1 font-body text-sm opacity-60 leading-relaxed max-w-2xl">
                    {s.note}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
