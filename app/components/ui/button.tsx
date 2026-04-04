"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border bg-clip-padding text-sm font-body uppercase tracking-[0.06em] font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[#1B1B1B] text-[#F8F5EC] border-transparent dark:bg-[#F8F5EC] dark:text-[#1B1B1B] [a]:hover:bg-[#1B1B1B]/80 dark:hover:bg-[#F8F5EC]/80 rounded-tl-[var(--radius-xl)] rounded-tr-[var(--radius-xs)] rounded-br-[var(--radius-xl)] rounded-bl-[var(--radius-sm)]",
        outline:
          "border-2 border-[#1B1B1B] dark:border-[#F8F5EC] bg-transparent hover:bg-[#1B1B1B] hover:text-[#F8F5EC] dark:hover:bg-[#F8F5EC] dark:hover:text-[#1B1B1B] aria-expanded:bg-muted aria-expanded:text-foreground rounded-tl-[var(--radius-xl)] rounded-tr-[var(--radius-xs)] rounded-br-[var(--radius-xl)] rounded-bl-[var(--radius-sm)]",
        secondary:
          "bg-[#CAF1F0] text-[#1B1B1B] border-[#000000] hover:bg-[#CAF1F0]/80 rounded-[var(--radius-none)]",
        ghost:
          "border-transparent hover:bg-[#0456fb] hover:text-[#F8F5EC] aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 rounded-none",
        destructive:
          "bg-[#E67A7A] text-white border-transparent hover:bg-[#E67A7A]/80 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 rounded-[clip-path:var(--cut-sm)]",
        link: "border-transparent text-[#0456fb] underline-offset-4 hover:underline rounded-none",
        gold: "bg-[#0456fb] text-[#F8F5EC] border-transparent hover:-translate-y-0.5 rounded-tl-[var(--radius-xl)] rounded-tr-[var(--radius-xs)] rounded-br-[var(--radius-xl)] rounded-bl-[var(--radius-sm)]",
      },
      size: {
        default:
          "h-10 gap-2 px-5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 px-3 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-4 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-8 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-7 in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
