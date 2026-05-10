"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useStorage, useSelf } from "@/liveblocks.config";
import { Timer } from "./Timer";
import type { GuessEntry } from "@/liveblocks.config";
import type { PromptEntry } from "@/lib/game-types";
import Image from "next/image";
import { BOUNCY } from "@/components/ui/motion-presets";
import { log } from "@/lib/logger";

type GuessingPhaseProps = {
  roomCode: string;
  prompts: PromptEntry[] | null;
  currentPromptIndex: number;
  onGuessSubmitted: (guess: GuessEntry) => void;
  category: string;
};

type GuessState = {
  ok: boolean;
  isCorrect: boolean;
  error: string | null;
};

const INITIAL: GuessState = { ok: false, isCorrect: false, error: null };

function GuessSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-3 bg-riso-teal text-white border-2 border-gray-900 rounded-lg font-bold shadow-[4px_4px_0_var(--color-gray-900)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--color-gray-900)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed transition-all"
    >
      {pending ? "..." : "Guess!"}
    </button>
  );
}

export function GuessingPhase({
  roomCode,
  prompts,
  currentPromptIndex,
  onGuessSubmitted,
  category,
}: GuessingPhaseProps) {
  const self = useSelf();
  const currentGuesses = useStorage((root) => root.currentGuesses);

  if (!prompts || prompts.length === 0) {
    return (
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-riso-teal border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Loading images...</p>
      </div>
    );
  }

  const currentPrompt = prompts[currentPromptIndex];
  if (!currentPrompt) return null;

  const currentUserId = self?.id as string;
  const isMyPrompt = currentPrompt.userId === currentUserId;

  // `key={currentPromptIndex}` remounts GuessForm on prompt change, which
  // resets its local `hasGuessedCorrectly` state without an effect-driven
  // reset.
  return (
    <GuessForm
      key={currentPromptIndex}
      currentPrompt={currentPrompt}
      currentPromptIndex={currentPromptIndex}
      promptsLength={prompts.length}
      prompts={prompts}
      currentGuesses={currentGuesses ?? null}
      currentUserId={currentUserId}
      isMyPrompt={isMyPrompt}
      roomCode={roomCode}
      category={category}
      onGuessSubmitted={onGuessSubmitted}
    />
  );
}

type GuessFormProps = {
  currentPrompt: PromptEntry;
  currentPromptIndex: number;
  promptsLength: number;
  prompts: PromptEntry[];
  currentGuesses: readonly GuessEntry[] | null;
  currentUserId: string;
  isMyPrompt: boolean;
  roomCode: string;
  category: string;
  onGuessSubmitted: (guess: GuessEntry) => void;
};

function GuessForm({
  currentPrompt,
  currentPromptIndex,
  promptsLength,
  prompts,
  currentGuesses,
  currentUserId,
  isMyPrompt,
  roomCode,
  category,
  onGuessSubmitted,
}: GuessFormProps) {
  async function submit(
    _prev: GuessState,
    formData: FormData,
  ): Promise<GuessState> {
    const guessText = (formData.get("guessText") as string | null)?.trim();
    if (!guessText || isMyPrompt) {
      return { ok: false, isCorrect: false, error: null };
    }
    try {
      const res = await fetch(`/api/games/${roomCode}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: currentPrompt.promptId,
          guessText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          isCorrect: false,
          error: data.error ?? "Failed to submit",
        };
      }
      onGuessSubmitted({
        userId: currentUserId,
        username: data.username || "You",
        guessText,
        isCorrect: data.isCorrect,
        pointsAwarded: data.pointsAwarded ?? 0,
        timestamp: Date.now(),
      });
      return { ok: true, isCorrect: data.isCorrect, error: null };
    } catch (e) {
      log.error("GuessingPhase", "Failed to submit guess", e);
      return { ok: false, isCorrect: false, error: "Network error" };
    }
  }

  const [state, formAction] = useActionState(submit, INITIAL);
  // Derive UI state from action result — no useState/useEffect needed.
  const hasGuessedCorrectly = state.ok && state.isCorrect;

  return (
    <div className="relative flex flex-col items-center gap-4 sm:gap-6 w-full max-w-2xl">
      <Timer />

      <div className="text-center">
        {category && (
          <span className="text-xs font-medium uppercase tracking-wide text-riso-teal bg-riso-teal/10 px-3 py-1 rounded-full border border-riso-teal/30">
            {category}
          </span>
        )}
        <p className="text-gray-600 text-sm mt-2">
          Image {currentPromptIndex + 1} of {promptsLength} — by{" "}
          <span className="font-medium text-gray-900">
            {currentPrompt.username}
          </span>
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPromptIndex}
          initial={{ opacity: 0, scale: 0.95, rotate: -1 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          {currentPrompt.imageUrl ? (
            <div className="rounded-xl overflow-hidden border-2 border-gray-900/10 shadow-[4px_4px_0_--theme(--color-gray-900/0.1)]">
              <Image
                src={currentPrompt.imageUrl}
                alt="AI generated image"
                className="max-w-full max-h-100 object-contain"
                width={400}
                height={400}
              />
            </div>
          ) : (
            <div className="w-full h-64 bg-white/60 rounded-xl border-2 border-gray-900/10 flex items-center justify-center text-gray-500">
              No image generated
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {isMyPrompt ? (
        <div className="bg-riso-purple/10 border-2 border-riso-purple/30 rounded-lg p-4 text-center">
          <p className="text-riso-purple">
            This is your image! The target was:{" "}
            <span className="font-bold">{currentPrompt.targetWord}</span>
          </p>
          <p className="text-riso-purple/70 text-sm mt-1">
            Watch others try to guess...
          </p>
        </div>
      ) : hasGuessedCorrectly ? (
        <motion.div
          className="bg-riso-teal/10 border-2 border-riso-teal/30 rounded-lg p-4 text-center"
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={BOUNCY}
        >
          <p className="text-riso-teal font-bold">You guessed correctly!</p>
        </motion.div>
      ) : (
        <form action={formAction} className="flex gap-2 w-full">
          <input
            type="text"
            name="guessText"
            placeholder="Type your guess..."
            required
            maxLength={200}
            className="flex-1 bg-white/60 border-2 border-gray-900/10 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-riso-teal/50"
          />
          <GuessSubmitButton />
        </form>
      )}

      {state.error && <p className="text-riso-red text-sm">{state.error}</p>}

      {/* Live guess feed */}
      {currentGuesses && currentGuesses.length > 0 && (
        <div className="w-full">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Guesses</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            <AnimatePresence initial={false}>
              {[...currentGuesses].reverse().map((g) => (
                <motion.div
                  key={`${g.userId}-${g.timestamp}`}
                  initial={{ opacity: 0, x: 24, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  className={`px-3 py-1.5 rounded text-sm ${
                    g.isCorrect
                      ? "bg-riso-teal/10 border-2 border-riso-teal/30 text-riso-teal"
                      : "bg-white/60 text-gray-600"
                  }`}
                >
                  <span className="font-medium">{g.username}:</span>{" "}
                  {g.isCorrect ? (
                    <span>Guessed correctly! (+{g.pointsAwarded}pts)</span>
                  ) : (
                    <span>{g.guessText}</span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      {/* Preload all prompt images for instant index transitions */}
      <div
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none"
        style={{ left: "-9999px" }}
      >
        {prompts.map((p) =>
          p.imageUrl ? (
            <Image
              key={p.promptId}
              src={p.imageUrl}
              width={400}
              height={400}
              alt=""
              loading="eager"
            />
          ) : null,
        )}
      </div>
    </div>
  );
}
