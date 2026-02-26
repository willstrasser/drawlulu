"use client";

import type { PlayerScore, PromptBreakdown } from "@/lib/game-types";
import Image from "next/image";

type ScoreboardProps = {
  isHost: boolean;
  scores: PlayerScore[] | null;
  promptBreakdowns: PromptBreakdown[] | null;
  onPlayAgain: () => void;
};

export function Scoreboard({
  isHost,
  scores,
  promptBreakdowns,
  onPlayAgain,
}: ScoreboardProps) {
  const sortedScores = scores
    ? [...scores].sort((a, b) => b.score - a.score)
    : [];

  if (!scores) {
    return (
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-riso-teal border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Calculating scores...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg">
      <h2 className="text-3xl font-bold text-gray-900">Round Results</h2>

      {/* Scores */}
      <div className="w-full space-y-2">
        {sortedScores.map((player, i) => (
          <div
            key={player.userId}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 ${
              i === 0
                ? "bg-riso-yellow/30 border-riso-yellow"
                : "bg-white/60 border-gray-900/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl font-bold ${
                  i === 0
                    ? "text-riso-red"
                    : i === 1
                      ? "text-gray-500"
                      : i === 2
                        ? "text-amber-600"
                        : "text-gray-400"
                }`}
              >
                #{i + 1}
              </span>
              <span className="font-medium text-gray-900">
                {player.username}
              </span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              {player.score}pts
            </span>
          </div>
        ))}
      </div>

      {/* Per-prompt breakdown */}
      {promptBreakdowns && promptBreakdowns.length > 0 && (
        <div className="w-full">
          <h3 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">
            Round Summary
          </h3>
          <div className="space-y-4">
            {promptBreakdowns.map((b) => (
              <div
                key={b.promptId}
                className="bg-white/60 backdrop-blur-sm border-2 border-gray-900/10 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  {b.imageUrl && (
                    <Image
                      src={b.imageUrl}
                      alt=""
                      className="h-14 w-14 rounded-lg object-cover"
                      width={56}
                      height={56}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {b.prompter}{" "}
                      <span className="text-gray-500 font-normal">drew</span>{" "}
                      <span className="text-riso-teal">{b.targetWord}</span>
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">
                        Prompter bonus:{" "}
                        <span className="text-gray-900 font-medium">
                          {b.prompterPoints}pts
                        </span>
                      </span>
                      {b.forbiddenWordsUsed.length > 0 && (
                        <span className="text-riso-red">
                          ({b.forbiddenWordsUsed.length} taboo word
                          {b.forbiddenWordsUsed.length > 1 ? "s" : ""} used)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {b.correctGuesses.length > 0 ? (
                  <div className="pl-2 space-y-1">
                    {b.correctGuesses.map((g, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-700">
                          {i === 0
                            ? "🥇"
                            : i === 1
                              ? "🥈"
                              : i === 2
                                ? "🥉"
                                : `#${i + 1}`}{" "}
                          {g.username}
                        </span>
                        <span className="text-riso-teal font-medium">
                          +{g.points}pts
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 pl-2">
                    No correct guesses
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isHost ? (
        <button
          onClick={onPlayAgain}
          className="px-8 py-3 bg-riso-teal text-white border-2 border-gray-900 rounded-xl font-bold text-lg shadow-[4px_4px_0_var(--color-gray-900)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--color-gray-900)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
        >
          Play Again
        </button>
      ) : (
        <p className="text-gray-600">Waiting for host to start next round...</p>
      )}
    </div>
  );
}
