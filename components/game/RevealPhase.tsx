"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { PromptEntry } from "@/lib/game-types";
import type { GuessEntry } from "@/liveblocks.config";
import { AnnotatedPrompt } from "./AnnotatedPrompt";
import { WOBBLE, BOUNCY } from "@/components/ui/motion-presets";

type RevealPhaseProps = {
  prompt: PromptEntry;
  correctGuesses: GuessEntry[];
};

export function RevealPhase({ prompt, correctGuesses }: RevealPhaseProps) {
  return (
    <div
      key={prompt.promptId}
      className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-2xl"
    >
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
        <motion.p
          className="text-gray-600 text-sm"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...WOBBLE, delay: 0.1 }}
        >
          <span className="font-medium text-gray-900">{prompt.username}</span>{" "}
          was drawing:
        </motion.p>
        <motion.h2
          className="text-3xl sm:text-4xl font-bold tracking-tight mt-1"
          initial={{ opacity: 0, scale: 0.5, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ ...WOBBLE, delay: 0.25 }}
        >
          {prompt.targetWord}
        </motion.h2>
      </div>

      {prompt.imageUrl ? (
        <motion.div
          className="rounded-xl overflow-hidden border-2 border-gray-900/10 shadow-[4px_4px_0_--theme(--color-gray-900/0.1)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...WOBBLE, delay: 0.45 }}
        >
          <Image
            src={prompt.imageUrl}
            alt="AI generated image"
            className="max-w-full max-h-100 object-contain"
            width={400}
            height={400}
          />
        </motion.div>
      ) : (
        <motion.div
          className="w-full h-64 bg-white/60 rounded-xl border-2 border-gray-900/10 flex items-center justify-center text-gray-500"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...WOBBLE, delay: 0.45 }}
        >
          No image generated
        </motion.div>
      )}

      {prompt.sanitizedPrompt && (
        <motion.div
          className="w-full bg-riso-purple/10 border-2 border-riso-purple/30 rounded-lg p-4"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...WOBBLE, delay: 0.55 }}
        >
          <p className="text-riso-purple text-sm">
            Their prompt:{" "}
            <span className="font-medium">
              <AnnotatedPrompt
                sanitizedPrompt={prompt.sanitizedPrompt}
                forbiddenWords={prompt.forbiddenWordsUsed}
              />
            </span>
          </p>
        </motion.div>
      )}

      <div className="w-full">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Results</h3>
        {correctGuesses.length > 0 ? (
          <div className="space-y-1">
            {correctGuesses.map((g, i) => (
              <motion.div
                key={g.userId}
                className="px-3 py-2 rounded bg-riso-teal/10 border-2 border-riso-teal/30 text-riso-teal text-sm"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...BOUNCY, delay: 0.65 + i * 0.1 }}
              >
                <span className="font-medium">{g.username}</span> guessed it! (+
                {g.pointsAwarded}pts)
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className="px-3 py-2 rounded bg-white/60 border-2 border-gray-900/10 text-gray-500 text-sm"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...BOUNCY, delay: 0.65 }}
          >
            Nobody guessed it
          </motion.div>
        )}
      </div>
    </div>
  );
}
