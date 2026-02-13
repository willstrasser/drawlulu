"use client";

import { useState } from "react";
import { useStorage } from "@/liveblocks.config";
import { Timer } from "./Timer";
import type { GuessEntry, PromptEntry } from "@/liveblocks.config";

type GuessingPhaseProps = {
  currentClerkId: string;
  roomCode: string;
  onGuessSubmitted: (guess: GuessEntry) => void;
};

export function GuessingPhase({
  currentClerkId,
  roomCode,
  onGuessSubmitted,
}: GuessingPhaseProps) {
  const prompts = useStorage((root) => root.prompts);
  const currentIndex = useStorage((root) => root.currentPromptIndex);
  const currentGuesses = useStorage((root) => root.currentGuesses);
  const [guessText, setGuessText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false);

  if (!prompts || prompts.length === 0) {
    return <p className="text-gray-400">No prompts to show.</p>;
  }

  const idx = currentIndex ?? 0;
  const currentPrompt: PromptEntry = prompts[idx];
  if (!currentPrompt) return null;

  const isMyPrompt = currentPrompt.userId === currentClerkId;

  const handleGuess = async () => {
    if (!guessText.trim() || isMyPrompt || hasGuessedCorrectly) return;
    setSubmitting(true);
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
      if (data.isCorrect) {
        setHasGuessedCorrectly(true);
      }
      onGuessSubmitted({
        userId: currentClerkId,
        username: data.username || "You",
        guessText: guessText.trim(),
        isCorrect: data.isCorrect,
        pointsAwarded: data.pointsAwarded || 0,
        timestamp: Date.now(),
      });
      setGuessText("");
    } catch (e) {
      console.error("Failed to submit guess:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      <Timer />

      <div className="text-center">
        <p className="text-gray-400 text-sm">
          Image {idx + 1} of {prompts.length} — by{" "}
          <span className="font-medium text-white">
            {currentPrompt.username}
          </span>
        </p>
      </div>

      {currentPrompt.imageUrl ? (
        <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
          <img
            src={currentPrompt.imageUrl}
            alt="AI generated image"
            className="max-w-full max-h-[400px] object-contain"
          />
        </div>
      ) : (
        <div className="w-full h-64 bg-white/5 rounded-xl flex items-center justify-center text-gray-500">
          No image generated
        </div>
      )}

      {isMyPrompt ? (
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 text-center">
          <p className="text-blue-300">
            This is your image! The target was:{" "}
            <span className="font-bold">{currentPrompt.targetWord}</span>
          </p>
          <p className="text-blue-400 text-sm mt-1">
            Watch others try to guess...
          </p>
        </div>
      ) : hasGuessedCorrectly ? (
        <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 text-center">
          <p className="text-green-300 font-bold">You guessed correctly!</p>
        </div>
      ) : (
        <div className="flex gap-2 w-full">
          <input
            type="text"
            value={guessText}
            onChange={(e) => setGuessText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGuess()}
            placeholder="Type your guess..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
          />
          <button
            onClick={handleGuess}
            disabled={!guessText.trim() || submitting}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
          >
            Guess
          </button>
        </div>
      )}

      {/* Live guess feed */}
      {currentGuesses && currentGuesses.length > 0 && (
        <div className="w-full">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Guesses</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {[...currentGuesses].reverse().map((g, i) => (
              <div
                key={i}
                className={`px-3 py-1.5 rounded text-sm ${
                  g.isCorrect
                    ? "bg-green-900/30 border border-green-500/30 text-green-300"
                    : "bg-white/5 text-gray-400"
                }`}
              >
                <span className="font-medium">{g.username}:</span>{" "}
                {g.isCorrect ? (
                  <span>
                    Guessed correctly! (+{g.pointsAwarded}pts)
                  </span>
                ) : (
                  <span>{g.guessText}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
