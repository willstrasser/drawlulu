"use client";

import { motion } from "motion/react";
import type { PlayerScore, PromptBreakdown } from "@/lib/game-types";
import Image from "next/image";
import { AnnotatedPrompt } from "./AnnotatedPrompt";
import { WOBBLE, SETTLE } from "@/components/ui/motion-presets";

type ScoreboardProps = {
  isHost: boolean;
  roundNumber: number;
  roundScores: PlayerScore[] | null;
  cumulativeScores: PlayerScore[] | null;
  promptBreakdowns: PromptBreakdown[] | null;
  onPlayAgain: () => void;
  onNewGame: () => void;
};

function ScoreList({ scores }: { scores: PlayerScore[] }) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  return (
    <div className="w-full space-y-2">
      {sorted.map((player, i) => (
        <motion.div
          key={player.userId}
          className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 ${
            i === 0
              ? "bg-riso-yellow/30 border-riso-yellow"
              : "bg-white/60 border-gray-900/10"
          }`}
          initial={{ opacity: 0, x: -20, rotate: i === 0 ? -2.5 : -1.5 }}
          animate={{ opacity: 1, x: 0, rotate: 0, scale: i === 0 ? [1, 1.04, 1] : 1 }}
          transition={{
            ...SETTLE,
            delay: i * 0.08,
            scale: i === 0 ? { delay: i * 0.08 + 0.3, duration: 0.4 } : undefined,
          }}
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
            <span className="font-medium text-gray-900">{player.username}</span>
          </div>
          <span className="text-xl font-bold text-gray-900">{player.score}pts</span>
        </motion.div>
      ))}
    </div>
  );
}

export function Scoreboard({
  isHost,
  roundNumber,
  roundScores,
  cumulativeScores,
  promptBreakdowns,
  onPlayAgain,
  onNewGame,
}: ScoreboardProps) {
  if (!roundScores) {
    return (
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-riso-teal border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Calculating scores...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:gap-8 w-full max-w-lg">
      <motion.h2
        className="text-3xl font-bold text-gray-900"
        initial={{ opacity: 0, y: -20, rotate: 1.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={WOBBLE}
      >
        Round {roundNumber} Results
      </motion.h2>

      {/* This round scores */}
      <div className="w-full">
        <h3 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">
          This Round
        </h3>
        <ScoreList scores={roundScores} />
      </div>

      {/* Running totals — only shown from round 2 onward */}
      {roundNumber > 1 && cumulativeScores && cumulativeScores.length > 0 && (
        <div className="w-full">
          <h3 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">
            Running Totals
          </h3>
          <ScoreList scores={cumulativeScores} />
        </div>
      )}

      {/* Per-prompt breakdown */}
      {promptBreakdowns && promptBreakdowns.length > 0 && (
        <div className="w-full">
          <h3 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">
            Round Summary
          </h3>
          <div className="space-y-4">
            {promptBreakdowns.map((b, index) => (
              <motion.div
                key={b.promptId}
                className="bg-white/60 backdrop-blur-sm border-2 border-gray-900/10 rounded-xl p-4 space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SETTLE, delay: index * 0.1 }}
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
                    {b.sanitizedPrompt && (
                      <p className="text-sm text-gray-600 mt-0.5">
                        <AnnotatedPrompt
                          sanitizedPrompt={b.sanitizedPrompt}
                          forbiddenWords={b.forbiddenWordsUsed}
                        />
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-0.5">
                      Prompter bonus:{" "}
                      <span className="text-gray-900 font-medium">
                        {b.prompterPoints}pts
                      </span>
                    </p>
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
                  <p className="text-sm text-gray-500 pl-2">No correct guesses</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {isHost ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onPlayAgain}
            className="w-full sm:w-auto px-8 py-3 bg-riso-teal text-white border-2 border-gray-900 rounded-xl font-bold text-lg shadow-[4px_4px_0_var(--color-gray-900)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--color-gray-900)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            Next Round
          </button>
          <button
            onClick={onNewGame}
            className="w-full sm:w-auto px-8 py-3 bg-white text-gray-900 border-2 border-gray-900 rounded-xl font-bold text-lg shadow-[4px_4px_0_var(--color-gray-900)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--color-gray-900)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            New Game
          </button>
        </div>
      ) : (
        <p className="text-gray-600">Waiting for host to start next round...</p>
      )}
    </div>
  );
}
