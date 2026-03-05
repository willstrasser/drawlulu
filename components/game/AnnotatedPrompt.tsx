"use client";

/**
 * Renders a sanitized prompt string inline, replacing each `___` placeholder
 * with a red chip containing the actual forbidden word that was there.
 *
 * `sanitizedPrompt` is the original text with taboo words replaced by `___`
 * (produced by validateTabooWords). `forbiddenWords` is the ordered list of
 * words that were substituted, in the same positional order as the blanks.
 */
export function AnnotatedPrompt({
  sanitizedPrompt,
  forbiddenWords,
}: {
  sanitizedPrompt: string;
  forbiddenWords: string[];
}) {
  if (forbiddenWords.length === 0) {
    return <span className="italic">&ldquo;{sanitizedPrompt}&rdquo;</span>;
  }

  const parts = sanitizedPrompt.split("___");

  return (
    <span className="italic">
      &ldquo;
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className="not-italic inline-block bg-riso-red/15 text-riso-red font-semibold px-1 rounded border border-riso-red/30 text-[0.9em] mx-0.5 align-baseline">
              {forbiddenWords[i] ?? "?"}
            </span>
          )}
        </span>
      ))}
      &rdquo;
    </span>
  );
}
