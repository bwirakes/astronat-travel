/**
 * The standing disclaimer at the bottom of every lesson page.
 * One line. Rendered by LessonShell, never by individual pages.
 *
 * Per the curriculum plan §3: this single sentence buys the curriculum
 * the right to use confident voice everywhere else.
 */
export function LessonDisclaimer() {
  return (
    <footer className="border-t border-[var(--surface-border)] mt-20 px-6 md:px-12 lg:px-20 py-10">
      <p className="max-w-3xl mx-auto text-center font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] opacity-50 leading-relaxed">
        Astrology is an interpretive tradition with deep historical roots —
        not a scientific theory. We teach it as a coherent symbolic system.
      </p>
    </footer>
  );
}
