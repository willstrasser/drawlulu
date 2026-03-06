"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Timer } from "./Timer";

const WOBBLE = { type: "spring", stiffness: 300, damping: 18 } as const;
const BOUNCY = { type: "spring", stiffness: 500, damping: 28 } as const;

type PromptPhaseProps = {
  targetWord: string;
  tabooWords: string[];
  promptId: string;
  roomCode: string;
  onSubmitted: () => void;
  hasSubmitted: boolean;
  category: string;
};

export function PromptPhase({
  targetWord,
  tabooWords,
  promptId,
  roomCode,
  onSubmitted,
  hasSubmitted,
  category,
}: PromptPhaseProps) {
  const [promptText, setPromptText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    forbiddenWordsUsed: string[];
  } | null>(null);

  const handleSubmit = async () => {
    if (!promptText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/games/${roomCode}/prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, promptText }),
      });
      const data = await res.json();
      setResult({ forbiddenWordsUsed: data.forbiddenWordsUsed || [] });
      onSubmitted();
    } catch (e) {
      console.error("Failed to submit prompt:", e);
    } finally {
      setSubmitting(false);
    }
  };

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
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Prompt Submitted!</h2>
          {result && result.forbiddenWordsUsed.length > 0 && (
            <div className="bg-riso-red/10 border-2 border-riso-red/50 rounded-lg p-3 mt-2">
              <p className="text-riso-red text-sm">
                Taboo words detected:{" "}
                {result.forbiddenWordsUsed.join(", ")} (-25pts each)
              </p>
            </div>
          )}
          <p className="text-gray-600 mt-4">
            Waiting for other players...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-lg">
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
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Describe an image that hints at your target word..."
          className="w-full bg-white/60 border-2 border-gray-900/10 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-riso-teal/50 resize-none"
          rows={3}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!promptText.trim() || submitting}
        className="px-8 py-3 bg-riso-teal text-white border-2 border-gray-900 rounded-xl font-bold text-lg shadow-[4px_4px_0_theme(colors.gray.900)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_theme(colors.gray.900)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed transition-all"
      >
        {submitting ? "Submitting..." : "Submit Prompt"}
      </button>
    </div>
  );
}
