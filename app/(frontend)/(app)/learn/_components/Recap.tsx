import { Check } from "lucide-react";

type RecapProps = {
  /** 3 short sentences. Closes the entry contract from LessonIntro objectives. */
  items: string[];
};

/**
 * The closing strip of Act 2 (Teach). Three bullets, "you now know..."
 * Visually low-key — this is a confirmation, not a hero moment.
 */
export function Recap({ items }: RecapProps) {
  return (
    <section className="px-6 md:px-12 lg:px-20 py-16 md:py-20 max-w-7xl mx-auto">
      <div className="max-w-3xl border-t border-[var(--surface-border)] pt-10">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.3em] mb-6"
          style={{ color: "var(--lesson-accent)" }}
        >
          You now know
        </div>
        <ul className="space-y-4">
          {items.map((item, i) => (
            <li key={i} className="flex gap-4 items-start">
              <Check
                className="w-4 h-4 mt-1.5 shrink-0"
                style={{ color: "var(--lesson-accent)" }}
              />
              <span className="font-body text-base md:text-lg leading-relaxed opacity-85">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
