"use client";

import { useState } from "react";
import { Timer } from "./Timer";

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
      <div className="flex flex-col items-center gap-6">
        <Timer />
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Prompt Submitted!</h2>
          {result && result.forbiddenWordsUsed.length > 0 && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mt-2">
              <p className="text-red-400 text-sm">
                Taboo words detected:{" "}
                {result.forbiddenWordsUsed.join(", ")} (-25pts each)
              </p>
            </div>
          )}
          <p className="text-gray-400 mt-4">
            Waiting for other players...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg">
      <Timer />

      {category && (
        <span className="text-xs font-medium uppercase tracking-wide text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
          {category}
        </span>
      )}

      <div className="text-center">
        <p className="text-gray-400 text-sm mb-1">Your target word is:</p>
        <h2 className="text-3xl font-bold text-green-400">{targetWord}</h2>
      </div>

      <div className="w-full">
        <h3 className="text-sm font-medium text-red-400 mb-2 uppercase tracking-wide">
          Taboo Words (don&apos;t use these!)
        </h3>
        <div className="flex flex-wrap gap-2">
          {tabooWords.map((word) => (
            <span
              key={word}
              className="bg-red-900/40 border border-red-500/50 text-red-300 px-3 py-1 rounded-full text-sm font-medium"
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full">
        <label className="block text-sm text-gray-400 mb-2">
          Write a prompt to generate an image of your target:
        </label>
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Describe an image that hints at your target word..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
          rows={3}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!promptText.trim() || submitting}
        className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-colors"
      >
        {submitting ? "Submitting..." : "Submit Prompt"}
      </button>
    </div>
  );
}
