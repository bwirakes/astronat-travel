"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

// ── Variant Context ────────────────────────────────────────────

type AccordionVariant = "default" | "editorial";
const AccordionVariantCtx = createContext<AccordionVariant>("default");

// ── Accordion Root ─────────────────────────────────────────────

type AccordionRootProps = (
  | React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>
) & {
  variant?: AccordionVariant;
};

function Accordion({ variant = "default", className, ...props }: AccordionRootProps) {
  return (
    <AccordionVariantCtx.Provider value={variant}>
      <AccordionPrimitive.Root
        className={cn("w-full", className)}
        {...(props as any)}
      />
    </AccordionVariantCtx.Provider>
  );
}

// ── Accordion Item ─────────────────────────────────────────────

interface AccordionItemProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {
  showIndex?: number;
}

function AccordionItem({ showIndex, className, ...props }: AccordionItemProps) {
  const variant = useContext(AccordionVariantCtx);
  const dividerColor =
    variant === "editorial"
      ? "1px solid rgba(248, 245, 236, 0.15)"
      : "1px solid var(--surface-border)";

  return (
    <AccordionPrimitive.Item
      data-show-index={showIndex}
      className={cn("accordion-item", className)}
      style={{ borderBottom: dividerColor }}
      {...props}
    />
  );
}

// ── Accordion Trigger ──────────────────────────────────────────

interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  label?: string;
  meta?: string;
  showIndex?: number;
}

function AccordionTrigger({
  label,
  meta,
  showIndex,
  children,
  className,
  ...props
}: AccordionTriggerProps) {
  const variant = useContext(AccordionVariantCtx);
  const textColor =
    variant === "editorial" ? "var(--color-eggshell)" : "var(--text-primary)";

  return (
    <AccordionPrimitive.Header className="m-0">
      <AccordionPrimitive.Trigger
        className={cn("group astro-accordion-trigger", className)}
        style={{ color: textColor, padding: "1rem 0" }}
        {...props}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
          {/* Ghost number prefix */}
          {showIndex !== undefined && (
            <span
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "1.5rem",
                opacity: 0.3,
                lineHeight: 1,
                minWidth: "2rem",
                color: textColor,
              }}
            >
              {showIndex}
            </span>
          )}

          {/* Label or raw children */}
          {label ? (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
                flex: 1,
              }}
            >
              {label}
            </span>
          ) : (
            <span style={{ flex: 1 }}>{children}</span>
          )}

          {/* Meta (right-aligned) */}
          {meta && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                letterSpacing: "0.05em",
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                marginRight: "1.5rem",
              }}
            >
              {meta}
            </span>
          )}
        </div>

        {/* Auto-rotating chevron */}
        <svg
          className="AccordionChevron group-data-[state=open]:rotate-180 transition-transform duration-300"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          style={{ opacity: 0.4, flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

// ── Accordion Content ──────────────────────────────────────────

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={cn("astro-accordion-content", className)}
      {...props}
    >
      {children}
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
