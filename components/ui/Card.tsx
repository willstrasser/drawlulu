import { forwardRef, type HTMLAttributes } from "react";

type Tint = "neutral" | "primary" | "accent" | "danger" | "highlight";
type Padding = "none" | "sm" | "md" | "lg";
type Radius = "lg" | "xl" | "2xl";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tint?: Tint;
  padding?: Padding;
  radius?: Radius;
  /** Slightly translucent surface — keeps the riso blob backdrop visible. */
  translucent?: boolean;
};

const TINT_CLASSES: Record<Tint, string> = {
  neutral: "border-border/10",
  primary: "bg-primary/10 border-primary/30",
  accent: "bg-accent/10 border-accent/30",
  danger: "bg-danger/10 border-danger/30",
  highlight: "bg-highlight/30 border-highlight",
};

const PADDING_CLASSES: Record<Padding, string> = {
  none: "",
  sm: "px-3 py-2",
  md: "p-4",
  lg: "p-6",
};

const RADIUS_CLASSES: Record<Radius, string> = {
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
};

const BASE = "border-2";

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    tint = "neutral",
    padding = "md",
    radius = "xl",
    translucent = true,
    className = "",
    children,
    ...rest
  },
  ref,
) {
  // Neutral surface is the only tint that uses the translucent white wash.
  const surface =
    tint === "neutral" ? (translucent ? "bg-surface/60" : "bg-surface") : "";
  return (
    <div
      ref={ref}
      className={`${BASE} ${surface} ${TINT_CLASSES[tint]} ${RADIUS_CLASSES[radius]} ${PADDING_CLASSES[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
});
