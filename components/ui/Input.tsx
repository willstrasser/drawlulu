import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const BASE =
  "bg-surface/60 border-2 border-border/10 rounded-lg px-4 py-3 " +
  "text-foreground placeholder-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-primary/50";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", ...rest },
  ref,
) {
  return <input ref={ref} className={`${BASE} ${className}`} {...rest} />;
});
