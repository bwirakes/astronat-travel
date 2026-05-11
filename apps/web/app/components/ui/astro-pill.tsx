"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const pillVariants = cva(
  "inline-flex items-center font-mono uppercase tracking-[0.08em] border",
  {
    variants: {
      variant: {
        default:  "border-current text-current bg-transparent",
        accent:   "bg-[var(--color-y2k-blue)] text-[var(--color-eggshell)] border-transparent",
        sage:     "bg-transparent text-[var(--sage)] border-[var(--sage)]",
        gold:     "bg-transparent text-[var(--gold)] border-[var(--gold)]",
        spiced:   "bg-transparent text-[var(--color-spiced-life)] border-[var(--color-spiced-life)]",
        ghost:    "border-[var(--surface-border)] text-[var(--text-secondary)] bg-transparent",
      },
      size: {
        xs: "text-[0.5rem] px-[0.5rem] py-[0.15rem]",
        sm: "text-[0.55rem] px-[0.8rem] py-[0.3rem]",
        md: "text-[0.65rem] px-[1rem] py-[0.35rem]",
      },
      shape: {
        pill:   "rounded-full",
        cut:    "[clip-path:var(--cut-sm)] rounded-none",
        square: "rounded-none",
      },
    },
    defaultVariants: { variant: "default", size: "sm", shape: "pill" },
  }
);

export interface AstroPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {}

export function AstroPill({ className, variant, size, shape, ...props }: AstroPillProps) {
  return (
    <span
      className={cn(pillVariants({ variant, size, shape }), className)}
      {...props}
    />
  );
}
