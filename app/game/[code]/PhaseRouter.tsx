"use client";

import { Lobby } from "@/components/game/Lobby";
import { PromptPhase } from "@/components/game/PromptPhase";
import { GeneratingPhase } from "@/components/game/GeneratingPhase";
import { GuessingPhase } from "@/components/game/GuessingPhase";
import { Scoreboard } from "@/components/game/Scoreboard";
import { RevealPhase } from "@/components/game/RevealPhase";
import { PhaseError } from "@/components/game/PhaseError";
import { PHASE } from "@/liveblocks.config";
import type { GamePhase, GuessEntry } from "@/liveblocks.config";
import type {
  MyAssignment,
  PlayerScore,
  PromptBreakdown,
  PromptEntry,
} from "@/lib/game-types";

type PhaseRouterProps = {
  // Storage state
  gamePhase: GamePhase | null;
  isHost: boolean;
  code: string;
  currentPromptIndex: number | null;
  currentGuesses: readonly GuessEntry[] | null;
  roundNumber: number | null;
  selectedCategory: string | null;
  // Round data
  myAssignment: MyAssignment | null;
  prompts: PromptEntry[] | null;
  roundScores: PlayerScore[] | null;
  cumulativeScores: PlayerScore[] | null;
  promptBreakdowns: PromptBreakdown[] | null;
  fetchError: string | null;
  // Presence
  hasSubmittedPrompt: boolean;
  // Categories
  categories: string[];
  // Handlers
  onStart: (playerUserIds: string[]) => Promise<void>;
  onSelectCategory: (category: string) => void;
  onPromptSubmitted: () => void;
  onGuessSubmitted: (guess: GuessEntry) => void;
  onSkipGeneration: () => void;
  onPlayAgain: () => void;
  onNewGame: () => void;
};

export function PhaseRouter({
  gamePhase,
  isHost,
  code,
  currentPromptIndex,
  currentGuesses,
  roundNumber,
  selectedCategory,
  myAssignment,
  prompts,
  roundScores,
  cumulativeScores,
  promptBreakdowns,
  fetchError,
  hasSubmittedPrompt,
  categories,
  onStart,
  onSelectCategory,
  onPromptSubmitted,
  onGuessSubmitted,
  onSkipGeneration,
  onPlayAgain,
  onNewGame,
}: PhaseRouterProps) {
  if (gamePhase === PHASE.LOBBY) {
    return (
      <Lobby
        roomCode={code}
        isHost={isHost}
        onStart={onStart}
        categories={categories}
        selectedCategory={selectedCategory ?? ""}
        onSelectCategory={onSelectCategory}
      />
    );
  }

  if (gamePhase === PHASE.PROMPTING) {
    if (myAssignment) {
      return (
        <PromptPhase
          targetWord={myAssignment.targetWord}
          tabooWords={myAssignment.tabooWords}
          promptId={myAssignment.promptId}
          roomCode={code}
          onSubmitted={onPromptSubmitted}
          hasSubmitted={hasSubmittedPrompt}
          category={selectedCategory ?? ""}
        />
      );
    }
    if (fetchError) return <PhaseError error={fetchError} />;
    return (
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-riso-teal border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Loading your assignment...</p>
      </div>
    );
  }

  if (gamePhase === PHASE.GENERATING) {
    return <GeneratingPhase isHost={isHost} onSkip={onSkipGeneration} />;
  }

  if (gamePhase === PHASE.GUESSING) {
    if (fetchError) return <PhaseError error={fetchError} />;
    return (
      <GuessingPhase
        roomCode={code}
        prompts={prompts}
        currentPromptIndex={currentPromptIndex ?? 0}
        onGuessSubmitted={onGuessSubmitted}
        category={selectedCategory ?? ""}
      />
    );
  }

  if (gamePhase === PHASE.REVEALING && prompts) {
    const idx = currentPromptIndex ?? 0;
    const currentPrompt = prompts[idx];
    if (!currentPrompt) return null;
    return (
      <RevealPhase
        prompt={currentPrompt}
        correctGuesses={(currentGuesses ?? []).filter((g) => g.isCorrect)}
      />
    );
  }

  if (gamePhase === PHASE.SCOREBOARD) {
    if (fetchError) return <PhaseError error={fetchError} />;
    return (
      <Scoreboard
        isHost={isHost}
        roundNumber={roundNumber ?? 1}
        roundScores={roundScores}
        cumulativeScores={cumulativeScores}
        promptBreakdowns={promptBreakdowns}
        onPlayAgain={onPlayAgain}
        onNewGame={onNewGame}
      />
    );
  }

  return null;
}
