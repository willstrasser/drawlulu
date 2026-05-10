"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "motion/react";
import { Timer } from "./Timer";
import { WOBBLE, BOUNCY } from "@/components/ui/motion-presets";
import { StampButton } from "@/components/ui/StampButton";
import { log } from "@/lib/logger";

type PromptPhaseProps = {
  targetWord: string;
  tabooWords: string[];
  promptId: string;
  roomCode: string;
  onSubmitted: () => void;
  hasSubmitted: boolean;
  category: string;
};

type SubmitState = {
  ok: boolean;
  forbiddenWordsUsed: string[];
  error: string | null;
};

const INITIAL: SubmitState = { ok: false, forbiddenWordsUsed: [], error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <StampButton type="submit" variant="teal" size="lg" disabled={pending}>
      {pending ? "Submitting..." : "Submit Prompt"}
    </StampButton>
  );
}

export function PromptPhase({
  targetWord,
  tabooWords,
  promptId,
  roomCode,
  onSubmitted,
  hasSubmitted,
  category,
}: PromptPhaseProps) {
  async function submit(
    _prev: SubmitState,
    formData: FormData,
  ): Promise<SubmitState> {
    const promptText = (formData.get("promptText") as string | null)?.trim();
    if (!promptText) {
      return { ok: false, forbiddenWordsUsed: [], error: "Prompt is required" };
    }
    try {
      const res = await fetch(`/api/games/${roomCode}/prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, promptText }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          forbiddenWordsUsed: [],
          error: data.error ?? "Failed to submit",
        };
      }
      // Notify parent so it can update Liveblocks presence
      // (`hasSubmittedPrompt`). Calling here avoids a setState-in-effect.
      onSubmitted();
      return {
        ok: true,
        forbiddenWordsUsed: data.forbiddenWordsUsed ?? [],
        error: null,
      };
    } catch (e) {
      log.error("PromptPhase", "Failed to submit prompt", e);
      return { ok: false, forbiddenWordsUsed: [], error: "Network error" };
    }
  }

  const [state, formAction] = useActionState(submit, INITIAL);

  if (hasSubmitted) {
    return (
      <div className="flex flex-col items-center gap-4 sm:gap-6">
        <Timer />
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={BOUNCY}
        >
          <h2 className="text-2xl font-bold mb-2 text-gray-900">
            Prompt Submitted!
          </h2>
          {state.forbiddenWordsUsed.length > 0 && (
            <div className="bg-riso-red/10 border-2 border-riso-red/50 rounded-lg p-3 mt-2">
              <p className="text-riso-red text-sm">
                Taboo words detected: {state.forbiddenWordsUsed.join(", ")}{" "}
                (-25pts each)
              </p>
            </div>
          )}
          <p className="text-gray-600 mt-4">Waiting for other players...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-lg"
    >
      <Timer />

      {category && (
        <span className="text-xs font-medium uppercase tracking-wide text-riso-teal bg-riso-teal/10 px-3 py-1 rounded-full border border-riso-teal/30">
          {category}
        </span>
      )}

      <div className="text-center">
        <p className="text-gray-600 text-sm mb-1">Your target word is:</p>
        <motion.h2
          className="text-3xl font-bold text-riso-teal"
          initial={{ opacity: 0, scale: 0.7, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ ...WOBBLE, delay: 0.1 }}
        >
          {targetWord}
        </motion.h2>
      </div>

      <div className="w-full">
        <h3 className="text-sm font-medium text-riso-red mb-2 uppercase tracking-wide">
          Taboo Words (don&apos;t use these!)
        </h3>
        <div className="flex flex-wrap gap-2">
          {tabooWords.map((word, i) => (
            <motion.span
              key={word}
              className="bg-riso-red/10 border-2 border-riso-red/30 text-riso-red px-3 py-1 rounded-full text-sm font-medium"
              initial={{ opacity: 0, scale: 0.6, rotate: i % 2 === 0 ? -3 : 3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ ...BOUNCY, delay: 0.15 + i * 0.06 }}
            >
              {word}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="w-full">
        <label className="block text-sm text-gray-600 mb-2">
          Write a prompt to generate an image of your target:
        </label>
        <textarea
          name="promptText"
          placeholder="Describe an image that hints at your target word..."
          required
          maxLength={1000}
          className="w-full bg-white/60 border-2 border-gray-900/10 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-riso-teal/50 resize-none"
          rows={3}
        />
      </div>

      {state.error && <p className="text-riso-red text-sm">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
