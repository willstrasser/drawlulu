"use client";

import { useCallback, useEffect, useRef } from "react";
import { PHASE } from "@/liveblocks.config";
import type { PromptEntry } from "@/lib/game-types";

type UseGameTimerProps = {
  isHost: boolean;
  code: string;
  gamePhase: string | null;
  currentPromptIndex: number | null;
  prompts: PromptEntry[] | null;
  timerEndsAt: number | null;
  setGamePhase: (phase: string) => void;
  setTimerEndsAt: (endsAt: number | null) => void;
  setCurrentPromptIndex: (index: number) => void;
  clearGuesses: () => void;
};

export function useGameTimer({
  isHost,
  code,
  gamePhase,
  currentPromptIndex,
  prompts,
  timerEndsAt,
  setGamePhase,
  setTimerEndsAt,
  setCurrentPromptIndex,
  clearGuesses,
}: UseGameTimerProps): void {
  const phaseTransitionRef = useRef(false);
  const gamePhaseRef = useRef(gamePhase);
  const currentPromptIndexRef = useRef(currentPromptIndex);
  const promptsRef = useRef(prompts);

  // Keep refs in sync
  useEffect(() => {
    gamePhaseRef.current = gamePhase;
    currentPromptIndexRef.current = currentPromptIndex;
    promptsRef.current = prompts;
  }, [gamePhase, currentPromptIndex, prompts]);

  const handleTimerEnd = useCallback(async () => {
    if (phaseTransitionRef.current) return;
    phaseTransitionRef.current = true;

    const phase = gamePhaseRef.current;
    const idx = currentPromptIndexRef.current ?? 0;
    const currentPrompts = promptsRef.current;

    if (phase === PHASE.PROMPTING) {
      setGamePhase(PHASE.GENERATING);
      setTimerEndsAt(null);

      try {
        await fetch(`/api/games/${code}/generate`, {
          method: "POST",
        });

        setCurrentPromptIndex(0);
        clearGuesses();
        setGamePhase(PHASE.GUESSING);
        setTimerEndsAt(Date.now() + 30000);
      } catch (e) {
        console.error("Failed to generate images:", e);
      }
    } else if (phase === PHASE.GUESSING) {
      setGamePhase(PHASE.REVEALING);
      setTimerEndsAt(Date.now() + 7000);
    } else if (phase === PHASE.REVEALING) {
      const nextIndex = idx + 1;
      clearGuesses();
      if (currentPrompts && nextIndex < currentPrompts.length) {
        setCurrentPromptIndex(nextIndex);
        setGamePhase(PHASE.GUESSING);
        setTimerEndsAt(Date.now() + 30000);
      } else {
        setGamePhase(PHASE.SCOREBOARD);
        setTimerEndsAt(null);
      }
    }

    phaseTransitionRef.current = false;
  }, [code, setGamePhase, setTimerEndsAt, setCurrentPromptIndex, clearGuesses]);

  useEffect(() => {
    if (!isHost || !timerEndsAt) return;

    const timeLeft = timerEndsAt - Date.now();
    // Always use setTimeout — even when expired — to defer the mutation call
    // to a separate macrotask. This avoids calling mutations synchronously in
    // the same React effect cycle that just wrote to Liveblocks storage (e.g.
    // the allSubmitted early-skip), which can throw "storage not loaded".
    const timeout = setTimeout(handleTimerEnd, Math.max(0, timeLeft));
    return () => clearTimeout(timeout);
  }, [isHost, timerEndsAt, handleTimerEnd]);
}
