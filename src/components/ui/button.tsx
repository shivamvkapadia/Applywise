import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "tertiary" | "inverse" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium text-sm leading-none " +
  "transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  // Lavender CTA — scarce, primary action only
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  // Charcoal button with hairline border
  secondary:
    "bg-surface-1 text-ink border border-hairline hover:bg-surface-2 hover:border-hairline-strong",
  // Plain text button
  tertiary: "bg-transparent text-ink-muted hover:text-ink hover:bg-surface-1",
  // White-on-dark
  inverse: "bg-white text-canvas hover:bg-ink-muted",
  // Subtle destructive — green is the only chromatic accent, so danger stays neutral
  danger:
    "bg-transparent text-ink-subtle border border-hairline hover:text-ink hover:border-hairline-strong",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3",
  md: "h-9 px-3.5",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
