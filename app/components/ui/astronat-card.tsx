import * as React from "react"
import { cn } from "@/lib/utils"

interface AstronatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'surface' | 'eggshell' | 'charcoal' | 'black' | 'y2k-blue' | 'glass';
  shape?: 'asymmetric-md' | 'asymmetric-lg' | 'cut-md' | 'organic' | 'none';
  glow?: boolean;
}

const AstronatCard = React.forwardRef<HTMLDivElement, AstronatCardProps>(
  ({ className, variant = 'eggshell', shape = 'asymmetric-md', glow = false, ...props }, ref) => {
    
    const variantStyles = {
      primary: "bg-[var(--bg)] text-[var(--text-primary)] border-[var(--surface-border)]",
      surface: "bg-[var(--surface)] text-[var(--text-primary)] border-[var(--surface-border)] hover:border-[var(--color-y2k-blue)]",
      eggshell: "bg-[var(--color-eggshell)] text-[var(--color-charcoal)] border-[var(--surface-border)]",
      charcoal: "bg-[var(--color-charcoal)] text-[var(--color-eggshell)] border-white/10",
      black: "bg-[var(--color-black)] text-[var(--color-eggshell)] border-white/10",
      'y2k-blue': "bg-[var(--color-y2k-blue)] text-white border-white/20",
      glass: "bg-white/5 backdrop-blur-md text-white border-white/10",
    };

    const shapeStyles = {
      'asymmetric-md': "rounded-[var(--shape-asymmetric-md)]",
      'asymmetric-lg': "rounded-[var(--shape-asymmetric-lg)]",
      'cut-md': "[clip-path:var(--cut-md)]",
      'organic': "rounded-[var(--shape-organic-1)]",
      'none': "rounded-none",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative border transition-all duration-300",
          variantStyles[variant],
          shapeStyles[shape],
          glow && "shadow-[0_0_30px_rgba(0,0,0,0.1)] hover:shadow-[0_0_50px_rgba(0,0,0,0.15)]",
          className
        )}
        {...props}
      />
    )
  }
)
AstronatCard.displayName = "AstronatCard"

export { AstronatCard }
