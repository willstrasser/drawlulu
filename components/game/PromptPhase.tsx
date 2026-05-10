"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "motion/react";
import { Timer } from "./Timer";
import { WOBBLE, BOUNCY } from "@/components/ui/motion-presets";
import { StampButton } from "@/components/ui/StampButton";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Textarea } from "@/components/ui/Textarea";
import { PhaseShell, phaseShell } from "@/components/ui/PhaseShell";
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
    <StampButton type="submit" variant="primary" size="lg" disabled={pending}>
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
      <PhaseShell width="full">
        <Timer />
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={BOUNCY}
        >
          <h2 className="text-2xl font-bold mb-2 text-foreground">
            Prompt Submitted!
          </h2>
          {state.forbiddenWordsUsed.length > 0 && (
            <Card tint="danger" padding="sm" radius="lg" className="mt-2">
              <p className="text-danger text-sm">
                Taboo words detected: {state.forbiddenWordsUsed.join(", ")}{" "}
                (-25pts each)
              </p>
            </Card>
          )}
          <p className="text-gray-600 mt-4">Waiting for other players...</p>
        </motion.div>
      </PhaseShell>
    );
  }

  return (
    <form action={formAction} className={phaseShell({ width: "md" })}>
      <Timer />

      {category && (
        <Chip tint="primary" size="sm">
          {category}
        </Chip>
      )}

      <div className="text-center">
        <p className="text-gray-600 text-sm mb-1">Your target word is:</p>
        <motion.h2
          className="text-3xl font-bold text-primary"
          initial={{ opacity: 0, scale: 0.7, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ ...WOBBLE, delay: 0.1 }}
        >
          {targetWord}
        </motion.h2>
      </div>

      <div className="w-full">
        <h3 className="text-sm font-medium text-danger mb-2 uppercase tracking-wide">
          Taboo Words (don&apos;t use these!)
        </h3>
        <div className="flex flex-wrap gap-2">
          {tabooWords.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, scale: 0.6, rotate: i % 2 === 0 ? -3 : 3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ ...BOUNCY, delay: 0.15 + i * 0.06 }}
            >
              <Chip tint="danger" size="md" className="border-2">
                {word}
              </Chip>
            </motion.span>
          ))}
        </div>
      </div>

      <div className="w-full">
        <label className="block text-sm text-gray-600 mb-2">
          Write a prompt to generate an image of your target:
        </label>
        <Textarea
          name="promptText"
          placeholder="Describe an image that hints at your target word..."
          required
          maxLength={1000}
          className="w-full"
          rows={3}
        />
      </div>

      {state.error && <p className="text-danger text-sm">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
