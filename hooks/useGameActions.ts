"use client";

import { useRouter } from "next/navigation";
import { PHASE } from "@/liveblocks.config";
import type { GuessEntry } from "@/liveblocks.config";
import type { StorageMutations } from "./useStorageMutations";

type SetMyPresence = (patch: { hasSubmittedPrompt: boolean }) => void;

type UseGameActionsArgs = {
  code: string;
  selectedCategory: string | null | undefined;
  setMyPresence: SetMyPresence;
  storageMutations: StorageMutations;
};

export function useGameActions({
  code,
  selectedCategory,
  setMyPresence,
  storageMutations,
}: UseGameActionsArgs) {
  const router = useRouter();
  const {
    setGamePhase,
    setTimerEndsAt,
    setCurrentPromptIndex,
    setRoundNumber,
    setNewGameCode,
    addGuess,
    clearGuesses,
  } = storageMutations;

  const handleStart = async (playerUserIds: string[]) => {
    const res = await fetch(`/api/games/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerUserIds, category: selectedCategory ?? "" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to start");

    setRoundNumber(data.roundNumber);
    setMyPresence({ hasSubmittedPrompt: false });
    setGamePhase(PHASE.PROMPTING);
    setTimerEndsAt(Date.now() + 60000);
  };

  const handleNewGame = async () => {
    const res = await fetch("/api/games", { method: "POST" });
    const { roomCode } = await res.json();
    setNewGameCode(roomCode);
    router.push(`/game/${roomCode}`);
  };

  const handleGuessSubmitted = (guess: GuessEntry) => {
    addGuess(guess);
  };

  const handlePromptSubmitted = () => {
    setMyPresence({ hasSubmittedPrompt: true });
  };

  const handleSkipGeneration = () => {
    setCurrentPromptIndex(0);
    clearGuesses();
    setGamePhase(PHASE.GUESSING);
    setTimerEndsAt(Date.now() + 30000);
  };

  return {
    handleStart,
    handleNewGame,
    handleGuessSubmitted,
    handlePromptSubmitted,
    handleSkipGeneration,
  };
}

export type GameActions = ReturnType<typeof useGameActions>;
