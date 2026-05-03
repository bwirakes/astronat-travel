import React, { Children, isValidElement, cloneElement } from "react";

type ConceptStackProps = {
  /** Children should be ConceptCard instances. */
  children: React.ReactNode;
  /** Layout mode:
   *   - "single"     → one column (good for narrow content)
   *   - "alternate"  → cards alternate left/right, like the wheel pages today
   *   - "grid"       → 2-col grid on desktop (good for visual catalogs)
   */
  layout?: "single" | "alternate" | "grid";
};

/**
 * The container for a sequence of ConceptCards. Auto-numbers them by injecting
 * `index` so cards never have to compute their own position.
 */
export function ConceptStack({ children, layout = "alternate" }: ConceptStackProps) {
  const items = Children.toArray(children);

  if (layout === "grid") {
    return (
      <section className="px-6 md:px-12 lg:px-20 py-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {items.map((child, i) =>
            isValidElement(child)
              ? cloneElement(child as React.ReactElement<{ index?: number }>, { index: i })
              : child
          )}
        </div>
      </section>
    );
  }

  if (layout === "single") {
    return (
      <section className="px-6 md:px-12 lg:px-20 py-16 max-w-7xl mx-auto">
        <div className="space-y-12 md:space-y-20 max-w-2xl">
          {items.map((child, i) =>
            isValidElement(child)
              ? cloneElement(child as React.ReactElement<{ index?: number }>, { index: i })
              : child
          )}
        </div>
      </section>
    );
  }

  // Alternate
  return (
    <section className="px-6 md:px-12 lg:px-20 py-16 max-w-7xl mx-auto">
      <div className="space-y-16 md:space-y-32">
        {items.map((child, i) => {
          const side = i % 2 === 0 ? "md:mr-auto" : "md:ml-auto";
          return (
            <div key={i} className={side + " max-w-2xl"}>
              {isValidElement(child)
                ? cloneElement(child as React.ReactElement<{ index?: number }>, { index: i })
                : child}
            </div>
          );
        })}
      </div>
    </section>
  );
}
