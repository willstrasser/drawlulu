import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "accent" | "neutral";
type Size = "sm" | "md" | "lg";

type StampButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-white",
  accent: "bg-accent text-white",
  neutral: "bg-surface text-foreground",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-6 py-3 text-base rounded-lg",
  lg: "px-8 py-3 text-lg rounded-xl",
};

const BASE_CLASSES =
  "border-2 border-border font-bold shadow-[4px_4px_0_var(--color-border)] " +
  "hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--color-border)] " +
  "active:translate-x-1 active:translate-y-1 active:shadow-none " +
  "disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none " +
  "disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed " +
  "transition-all";

/**
 * The riso-style stamp button used across the app. Encapsulates the
 * "shadow-stamp + on-press translate" effect that was hand-rolled in
 * 6+ places before extraction.
 */
export const StampButton = forwardRef<HTMLButtonElement, StampButtonProps>(
  function StampButton(
    { variant = "primary", size = "md", className = "", children, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
