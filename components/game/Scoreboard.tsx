"use client";

import type { PromptEntry, PlayerScore } from "@/app/game/[code]/page";

type ScoreboardProps = {
  isHost: boolean;
  scores: PlayerScore[] | null;
  prompts: PromptEntry[] | null;
  onPlayAgain: () => void;
};

export function Scoreboard({ isHost, scores, prompts, onPlayAgain }: ScoreboardProps) {
  const sortedScores = scores
    ? [...scores].sort((a, b) => b.score - a.score)
    : [];

  if (!scores) {
    return (
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Calculating scores...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg">
      <h2 className="text-3xl font-bold">Round Results</h2>

      {/* Scores */}
      <div className="w-full space-y-2">
        {sortedScores.map((player, i) => (
          <div
            key={player.userId}
            className={`flex items-center justify-between px-4 py-3 rounded-xl ${
              i === 0
                ? "bg-yellow-900/30 border border-yellow-500/50"
                : "bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl font-bold ${
                  i === 0
                    ? "text-yellow-400"
                    : i === 1
                      ? "text-gray-300"
                      : i === 2
                        ? "text-amber-600"
                        : "text-gray-500"
                }`}
              >
                #{i + 1}
              </span>
              <span className="font-medium">{player.username}</span>
            </div>
            <span className="text-xl font-bold">{player.score}pts</span>
          </div>
        ))}
      </div>

      {/* Reveal targets */}
      {prompts && prompts.length > 0 && (
        <div className="w-full">
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
            Round Summary
          </h3>
          <div className="space-y-3">
            {prompts.map((p) => (
              <div
                key={p.promptId}
                className="flex items-center gap-3 bg-white/5 rounded-lg p-3"
              >
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-12 w-12 rounded object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{p.username}</p>
                  <p className="text-sm text-gray-400">
                    Target: <span className="text-green-400">{p.targetWord}</span>
                    {p.forbiddenWordsUsed.length > 0 && (
                      <span className="text-red-400 ml-2">
                        (used: {p.forbiddenWordsUsed.join(", ")})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isHost ? (
        <button
          onClick={onPlayAgain}
          className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg transition-colors"
        >
          Play Again
        </button>
      ) : (
        <p className="text-gray-400">Waiting for host to start next round...</p>
      )}
    </div>
  );
}
