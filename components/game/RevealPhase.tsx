"use client";

import Image from "next/image";
import type { PromptEntry } from "@/lib/game-types";
import type { GuessEntry } from "@/liveblocks.config";

type RevealPhaseProps = {
  prompt: PromptEntry;
  correctGuesses: GuessEntry[];
};

export function RevealPhase({ prompt, correctGuesses }: RevealPhaseProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {/* Progress bar auto-advances after 7s */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          key={prompt.promptId}
          className="h-full bg-riso-teal rounded-full"
          style={{
            animation: "drain 7s linear forwards",
          }}
        />
      </div>
      <style>{`
        @keyframes drain {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      <div className="text-center">
        <p className="text-gray-600 text-sm">
          <span className="font-medium text-gray-900">{prompt.username}</span>{" "}
          was drawing:
        </p>
        <h2 className="text-4xl font-bold tracking-tight mt-1">
          {prompt.targetWord}
        </h2>
      </div>

      {prompt.imageUrl ? (
        <div className="rounded-xl overflow-hidden border-2 border-gray-900/10 shadow-[4px_4px_0_--theme(--color-gray-900/0.1)]">
          <Image
            src={prompt.imageUrl}
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

      {prompt.sanitizedPrompt && (
        <div className="w-full bg-riso-purple/10 border-2 border-riso-purple/30 rounded-lg p-4">
          <p className="text-riso-purple text-sm">
            Their prompt:{" "}
            <span className="font-medium italic">
              &ldquo;{prompt.sanitizedPrompt}&rdquo;
            </span>
          </p>
        </div>
      )}

      <div className="w-full">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Results</h3>
        {correctGuesses.length > 0 ? (
          <div className="space-y-1">
            {correctGuesses.map((g) => (
              <div
                key={g.userId}
                className="px-3 py-2 rounded bg-riso-teal/10 border-2 border-riso-teal/30 text-riso-teal text-sm"
              >
                <span className="font-medium">{g.username}</span> guessed it!{" "}
                (+{g.pointsAwarded}pts)
              </div>
            ))}
          </div>
        ) : (
          <div className="px-3 py-2 rounded bg-white/60 border-2 border-gray-900/10 text-gray-500 text-sm">
            Nobody guessed it
          </div>
        )}
      </div>
    </div>
  );
}
