"use client";

import type { PlayerScore, PromptBreakdown } from "@/app/game/[code]/page";

type ScoreboardProps = {
  isHost: boolean;
  scores: PlayerScore[] | null;
  promptBreakdowns: PromptBreakdown[] | null;
  onPlayAgain: () => void;
};

export function Scoreboard({ isHost, scores, promptBreakdowns, onPlayAgain }: ScoreboardProps) {
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

      {/* Per-prompt breakdown */}
      {promptBreakdowns && promptBreakdowns.length > 0 && (
        <div className="w-full">
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
            Round Summary
          </h3>
          <div className="space-y-4">
            {promptBreakdowns.map((b) => (
              <div
                key={b.promptId}
                className="bg-white/5 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  {b.imageUrl && (
                    <img
                      src={b.imageUrl}
                      alt=""
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {b.prompter}{" "}
                      <span className="text-gray-500 font-normal">drew</span>{" "}
                      <span className="text-green-400">{b.targetWord}</span>
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">
                        Prompter bonus: <span className="text-white">{b.prompterPoints}pts</span>
                      </span>
                      {b.forbiddenWordsUsed.length > 0 && (
                        <span className="text-red-400">
                          ({b.forbiddenWordsUsed.length} taboo word{b.forbiddenWordsUsed.length > 1 ? "s" : ""} used)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {b.correctGuesses.length > 0 ? (
                  <div className="pl-2 space-y-1">
                    {b.correctGuesses.map((g, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}{" "}
                          {g.username}
                        </span>
                        <span className="text-green-400 font-medium">+{g.points}pts</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 pl-2">No correct guesses</p>
                )}
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
