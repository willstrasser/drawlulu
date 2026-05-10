import { forwardRef, type HTMLAttributes } from "react";

type Width = "sm" | "md" | "lg" | "full";
type Density = "compact" | "comfortable";

const WIDTH_CLASSES: Record<Width, string> = {
  sm: "w-full max-w-sm",
  md: "w-full max-w-lg",
  lg: "w-full max-w-2xl",
  full: "",
};

const DENSITY_CLASSES: Record<Density, string> = {
  compact: "gap-4 sm:gap-6",
  comfortable: "gap-5 sm:gap-8",
};

const BASE = "flex flex-col items-center";

/**
 * Class string for the phase-level outer container. Use this directly on
 * a `<form>` (PromptPhase) or any element where `<PhaseShell>` would
 * conflict with the semantic root.
 */
export function phaseShell({
  width = "md",
  density = "compact",
}: { width?: Width; density?: Density } = {}): string {
  return `${BASE} ${WIDTH_CLASSES[width]} ${DENSITY_CLASSES[density]}`.trim();
}

type PhaseShellProps = HTMLAttributes<HTMLDivElement> & {
  width?: Width;
  density?: Density;
};

export const PhaseShell = forwardRef<HTMLDivElement, PhaseShellProps>(
  function PhaseShell(
    { width = "md", density = "compact", className = "", children, ...rest },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={`${phaseShell({ width, density })} ${className}`}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
