export type Tradition = "hellenistic" | "modern" | "mundane" | "astronomy";

type TraditionChipProps = {
  tradition: Tradition;
  /** Override the default label text (e.g. "Hellenistic" → "Vedic"). */
  label?: string;
};

const TRADITION_META: Record<Tradition, { label: string; cssVar: string }> = {
  hellenistic: { label: "Hellenistic", cssVar: "var(--tradition-hellenistic)" },
  modern: { label: "Modern Western", cssVar: "var(--tradition-modern)" },
  mundane: { label: "Mundane", cssVar: "var(--tradition-mundane)" },
  astronomy: { label: "Astronomy", cssVar: "var(--tradition-astronomy)" },
};

/**
 * Color-coded "where this claim comes from" chip. The R-rule from the
 * curriculum plan: every interpretive claim is attributed to a tradition or
 * to "our reading" — never to "the cosmos."
 *
 * Visual: tiny dot + label. Matches the de-facto eyebrow chip style.
 */
export function TraditionChip({ tradition, label }: TraditionChipProps) {
  const meta = TRADITION_META[tradition];
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.25em] px-2.5 py-1 rounded-full border border-[var(--surface-border)]">
      <span
        aria-hidden
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: meta.cssVar }}
      />
      <span style={{ color: meta.cssVar }}>{label ?? meta.label}</span>
    </span>
  );
}
