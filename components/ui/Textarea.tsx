import { forwardRef, type TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const BASE =
  "bg-surface/60 border-2 border-border/10 rounded-lg px-4 py-3 " +
  "text-foreground placeholder-gray-400 resize-none " +
  "focus:outline-none focus:ring-2 focus:ring-primary/50";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className = "", ...rest }, ref) {
    return <textarea ref={ref} className={`${BASE} ${className}`} {...rest} />;
  },
);
