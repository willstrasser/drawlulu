import { forwardRef, type HTMLAttributes } from "react";

type Tint = "neutral" | "primary" | "accent" | "danger" | "highlight";
type Size = "sm" | "md";

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tint?: Tint;
  size?: Size;
  /** Visual prominence — `solid` fills the chip, `soft` is the tinted-bg variant. */
  variant?: "soft" | "solid";
};

const SOFT_TINT: Record<Tint, string> = {
  neutral: "bg-surface/60 border border-border/10 text-foreground",
  primary: "bg-primary/10 border border-primary/30 text-primary",
  accent: "bg-accent/10 border border-accent/30 text-accent",
  danger: "bg-danger/10 border border-danger/30 text-danger",
  highlight: "bg-highlight/30 border border-highlight text-foreground",
};

const SOLID_TINT: Record<Tint, string> = {
  neutral: "bg-surface text-foreground border border-border/20",
  primary: "bg-primary text-white border border-border",
  accent: "bg-accent text-white border border-border",
  danger: "bg-danger text-white border border-border",
  highlight: "bg-highlight text-foreground border border-border",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-2.5 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

const BASE =
  "inline-flex items-center rounded-full font-medium uppercase tracking-wide";

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  {
    tint = "neutral",
    size = "md",
    variant = "soft",
    className = "",
    children,
    ...rest
  },
  ref,
) {
  const tintMap = variant === "solid" ? SOLID_TINT : SOFT_TINT;
  return (
    <span
      ref={ref}
      className={`${BASE} ${tintMap[tint]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
});
