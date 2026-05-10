"use client";

import { useMutation } from "@/liveblocks.config";
import type { GamePhase, GuessEntry } from "@/liveblocks.config";

export function useStorageMutations() {
  const setGamePhase = useMutation(({ storage }, phase: GamePhase) => {
    storage.set("gamePhase", phase);
  }, []);

  const setTimerEndsAt = useMutation(({ storage }, endsAt: number | null) => {
    storage.set("timerEndsAt", endsAt);
  }, []);

  const setCurrentPromptIndex = useMutation(({ storage }, index: number) => {
    storage.set("currentPromptIndex", index);
  }, []);

  const setHostId = useMutation(({ storage }, id: string) => {
    storage.set("hostId", id);
  }, []);

  const setSelectedCategory = useMutation(({ storage }, category: string) => {
    storage.set("selectedCategory", category);
  }, []);

  const setRoundNumber = useMutation(({ storage }, n: number) => {
    storage.set("roundNumber", n);
  }, []);

  const setNewGameCode = useMutation(({ storage }, code: string) => {
    storage.set("newGameCode", code);
  }, []);

  // Reading currentGuesses from `storage.get` (mutable) rather than the
  // useStorage projection (readonly) keeps the array spread well-typed —
  // no `as unknown as` ladder needed at call sites.
  const addGuess = useMutation(({ storage }, guess: GuessEntry) => {
    const list = storage.get("currentGuesses") ?? [];
    storage.set("currentGuesses", [...list, guess]);
  }, []);

  const clearGuesses = useMutation(({ storage }) => {
    storage.set("currentGuesses", []);
  }, []);

  return {
    setGamePhase,
    setTimerEndsAt,
    setCurrentPromptIndex,
    setHostId,
    setSelectedCategory,
    setRoundNumber,
    setNewGameCode,
    addGuess,
    clearGuesses,
  };
}

export type StorageMutations = ReturnType<typeof useStorageMutations>;
