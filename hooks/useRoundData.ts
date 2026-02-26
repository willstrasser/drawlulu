"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { PHASE } from "@/liveblocks.config";
import type { RoundData, MyAssignment, PromptEntry, PlayerScore, PromptBreakdown } from "@/lib/game-types";

type UseRoundDataProps = {
  gamePhase: string | null;
  code: string;
  setMyPresence: (patch: { hasSubmittedPrompt: boolean }) => void;
};

export function useRoundData({ gamePhase, code, setMyPresence }: UseRoundDataProps): RoundData {
  const initialRoundData: RoundData = useMemo(
    () => ({
      myAssignment: null,
      prompts: null,
      scores: null,
      promptBreakdowns: null,
    }),
    [],
  );

  const [roundData, setRoundData] = useState<RoundData>(initialRoundData);
  const fetchingAssignmentRef = useRef(false);
  const prevPhaseRef = useRef(gamePhase);

  // Reset round-specific state whenever we enter "prompting" (including Play Again)
  useEffect(() => {
    if (
      gamePhase === PHASE.PROMPTING &&
      prevPhaseRef.current !== PHASE.PROMPTING
    ) {
      fetchingAssignmentRef.current = false;
      startTransition(() => {
        setRoundData(initialRoundData);
        setMyPresence({ hasSubmittedPrompt: false });
      });
    }
    prevPhaseRef.current = gamePhase;
  }, [gamePhase, initialRoundData, setMyPresence]);

  // Fetch assignment when phase changes to "prompting"
  useEffect(() => {
    if (
      gamePhase === PHASE.PROMPTING &&
      !roundData.myAssignment &&
      !fetchingAssignmentRef.current
    ) {
      fetchingAssignmentRef.current = true;
      fetch(`/api/games/${code}/my-assignment`)
        .then((res) => res.json())
        .then((data) => {
          if (data.promptId) {
            setRoundData((prev) => ({ ...prev, myAssignment: data as MyAssignment }));
          }
        })
        .catch((e) => console.error("Failed to fetch assignment:", e))
        .finally(() => {
          fetchingAssignmentRef.current = false;
        });
    }
  }, [gamePhase, code, roundData.myAssignment]);

  // Fetch prompts from DB when phase changes to "guessing"
  useEffect(() => {
    if (gamePhase === PHASE.GUESSING && !roundData.prompts) {
      fetch(`/api/games/${code}/round-prompts`)
        .then((res) => res.json())
        .then((data) => {
          if (data.prompts)
            setRoundData((prev) => ({ ...prev, prompts: data.prompts as PromptEntry[] }));
        })
        .catch((e) => console.error("Failed to fetch prompts:", e));
    }
  }, [gamePhase, code, roundData.prompts]);

  // Fetch scores from DB when phase changes to "scoreboard"
  useEffect(() => {
    if (gamePhase === PHASE.SCOREBOARD && !roundData.scores) {
      fetch(`/api/games/${code}/scores`)
        .then((res) => res.json())
        .then((data) => {
          if (data.scores || data.promptBreakdowns) {
            setRoundData((prev) => ({
              ...prev,
              scores: (data.scores as PlayerScore[]) ?? prev.scores,
              promptBreakdowns: (data.promptBreakdowns as PromptBreakdown[]) ?? prev.promptBreakdowns,
            }));
          }
        })
        .catch((e) => console.error("Failed to fetch scores:", e));
    }
  }, [gamePhase, code, roundData.scores]);

  return roundData;
}
