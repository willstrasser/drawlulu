"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import {
  RoomProvider,
  useMyPresence,
  useStorage,
  useMutation,
  useOthers,
  useSelf,
  useBroadcastEvent,
  useEventListener,
} from "@/liveblocks.config";
import type {
  GuessEntry,
  PromptEntry,
  PlayerScore,
  Storage,
} from "@/liveblocks.config";
import { useUser } from "@clerk/nextjs";
import { Lobby } from "@/components/game/Lobby";
import { PromptPhase } from "@/components/game/PromptPhase";
import { GeneratingPhase } from "@/components/game/GeneratingPhase";
import { GuessingPhase } from "@/components/game/GuessingPhase";
import { Scoreboard } from "@/components/game/Scoreboard";

type Assignment = {
  promptId: string;
  targetWord: string;
  tabooWords: string[];
};

function GameRoom({ code }: { code: string }) {
  const { user } = useUser();
  const self = useSelf();
  const others = useOthers();
  const gamePhase = useStorage((root) => root.gamePhase);
  const hostId = useStorage((root) => root.hostId);
  const roundId = useStorage((root) => root.roundId);
  const currentPromptIndex = useStorage((root) => root.currentPromptIndex);
  const prompts = useStorage((root) => root.prompts);

  const [myPresence, setMyPresence] = useMyPresence();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [hasSubmittedPrompt, setHasSubmittedPrompt] = useState(false);

  const broadcastEvent = useBroadcastEvent();

  const isHost = self?.id === hostId;
  const storageLoaded = gamePhase !== null;

  // Set username on join
  useEffect(() => {
    if (user) {
      setMyPresence({
        username: user.username || user.firstName || "Player",
        imageUrl: user.imageUrl,
        isReady: false,
      });
    }
  }, [user, setMyPresence]);

  // Mutations to update shared storage
  const setGamePhase = useMutation(({ storage }, phase: string) => {
    storage.set("gamePhase", phase as Storage["gamePhase"]);
  }, []);

  const setTimerEndsAt = useMutation(({ storage }, endsAt: number | null) => {
    storage.set("timerEndsAt", endsAt);
  }, []);

  const setPrompts = useMutation(({ storage }, promptList: PromptEntry[]) => {
    storage.set("prompts", promptList as unknown as Storage["prompts"]);
  }, []);

  const setCurrentPromptIndex = useMutation(({ storage }, index: number) => {
    storage.set("currentPromptIndex", index);
  }, []);

  const setRoundId = useMutation(({ storage }, id: string | null) => {
    storage.set("roundId", id);
  }, []);

  const setHostIdMutation = useMutation(({ storage }, id: string) => {
    storage.set("hostId", id);
  }, []);

  const setScores = useMutation(({ storage }, scores: PlayerScore[]) => {
    storage.set("scores", scores as unknown as Storage["scores"]);
  }, []);

  const addGuess = useMutation(({ storage }, guess: GuessEntry) => {
    const currentGuesses = storage.get("currentGuesses");
    if (Array.isArray(currentGuesses)) {
      storage.set("currentGuesses", [
        ...(currentGuesses as unknown as GuessEntry[]),
        guess,
      ] as unknown as Storage["currentGuesses"]);
    } else {
      storage.set("currentGuesses", [guess] as unknown as Storage["currentGuesses"]);
    }
  }, []);

  const clearGuesses = useMutation(({ storage }) => {
    storage.set("currentGuesses", [] as unknown as Storage["currentGuesses"]);
  }, []);

  // Set host on first join
  useEffect(() => {
    if (storageLoaded && self && !hostId) {
      setHostIdMutation(self.id as string);
    }
  }, [storageLoaded, self, hostId, setHostIdMutation]);

  // Listen for events from other players
  useEventListener(({ event }) => {
    const e = event as { type: string; [key: string]: unknown };
    if (e.type === "assignment") {
      setAssignment(e.assignment as Assignment);
    }
    if (e.type === "phase-change") {
      // handled by storage
    }
    if (e.type === "prompt-update") {
      // Refresh prompts from storage
    }
  });

  // Handle game start
  const handleStart = async (playerClerkIds: string[]) => {
    const res = await fetch(`/api/games/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerClerkIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setRoundId(data.roundId);
    setGamePhase("prompting");
    setTimerEndsAt(Date.now() + 60000);
    setHasSubmittedPrompt(false);

    // Set own assignment
    const myAssignment = data.assignments[self?.id as string];
    if (myAssignment) {
      setAssignment(myAssignment);
    }

    // Broadcast assignments to each player
    // Each player will receive their own assignment via the event
    broadcastEvent({
      type: "assignments",
      assignments: data.assignments,
    } as unknown as Record<string, never>);
  };

  // Listen for assignments broadcast
  useEventListener(({ event }) => {
    const e = event as {
      type: string;
      assignments?: Record<string, Assignment>;
    };
    if (e.type === "assignments" && e.assignments && self?.id) {
      const myAssignment = e.assignments[self.id as string];
      if (myAssignment) {
        setAssignment(myAssignment);
        setHasSubmittedPrompt(false);
      }
    }
  });

  // Timer check for phase transitions (host only)
  const timerEndsAt = useStorage((root) => root.timerEndsAt);
  const phaseTransitionRef = useRef(false);

  useEffect(() => {
    if (!isHost || !timerEndsAt || phaseTransitionRef.current) return;

    const timeLeft = timerEndsAt - Date.now();
    if (timeLeft <= 0) {
      handleTimerEnd();
      return;
    }

    const timeout = setTimeout(() => {
      handleTimerEnd();
    }, timeLeft);

    return () => clearTimeout(timeout);
  }, [isHost, timerEndsAt, gamePhase]);

  const handleTimerEnd = useCallback(async () => {
    if (phaseTransitionRef.current) return;
    phaseTransitionRef.current = true;

    if (gamePhase === "prompting") {
      // Move to generating phase
      setGamePhase("generating");
      setTimerEndsAt(null);

      // Trigger image generation
      try {
        const res = await fetch(`/api/games/${code}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roundId }),
        });
        const data = await res.json();

        // Build prompt entries for Liveblocks storage
        const allPlayers = [
          self,
          ...others,
        ];

        const promptEntries: PromptEntry[] = (data.generated || []).map(
          (g: { promptId: string; imageUrl: string }) => {
            // Find the player who owns this prompt
            // We need to look it up from our assignments
            return {
              promptId: g.promptId,
              userId: "", // Will be populated from DB
              username: "",
              targetWord: "",
              tabooWords: [],
              imageUrl: g.imageUrl,
              forbiddenWordsUsed: [],
            };
          }
        );

        // Fetch full prompt details
        const promptRes = await fetch(`/api/games/${code}/round-prompts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roundId }),
        });
        if (promptRes.ok) {
          const promptData = await promptRes.json();
          setPrompts(promptData.prompts);
        }

        setCurrentPromptIndex(0);
        clearGuesses();
        setGamePhase("guessing");
        setTimerEndsAt(Date.now() + 30000);
      } catch (e) {
        console.error("Failed to generate images:", e);
      }
    } else if (gamePhase === "guessing") {
      // Move to next image or scoreboard
      const nextIndex = (currentPromptIndex ?? 0) + 1;
      if (prompts && nextIndex < prompts.length) {
        setCurrentPromptIndex(nextIndex);
        clearGuesses();
        setTimerEndsAt(Date.now() + 30000);
        setHasSubmittedPrompt(false);
      } else {
        // Game over — fetch scores
        const scoresRes = await fetch(`/api/games/${code}/scores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roundId }),
        });
        if (scoresRes.ok) {
          const scoresData = await scoresRes.json();
          setScores(scoresData.scores);
        }
        setGamePhase("scoreboard");
        setTimerEndsAt(null);
      }
    }

    phaseTransitionRef.current = false;
  }, [gamePhase, roundId, currentPromptIndex, prompts]);

  // Handle guess submitted
  const handleGuessSubmitted = (guess: GuessEntry) => {
    addGuess(guess);
  };

  // Handle play again
  const handlePlayAgain = async () => {
    const allClerkIds = [
      self?.id,
      ...others.map((o) => o.id),
    ].filter(Boolean) as string[];

    await handleStart(allClerkIds);
  };

  // Handle prompt submitted
  const handlePromptSubmitted = () => {
    setHasSubmittedPrompt(true);
  };

  if (!storageLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">
          Draw<span className="text-green-400">lulu</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{myPresence?.username}</span>
          {user?.imageUrl && (
            <img
              src={user.imageUrl}
              alt=""
              className="h-8 w-8 rounded-full"
            />
          )}
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center p-8 min-h-[calc(100vh-57px)]">
        {gamePhase === "lobby" && (
          <Lobby
            roomCode={code}
            isHost={isHost}
            onStart={handleStart}
          />
        )}

        {gamePhase === "prompting" && assignment && (
          <PromptPhase
            targetWord={assignment.targetWord}
            tabooWords={assignment.tabooWords}
            promptId={assignment.promptId}
            roomCode={code}
            onSubmitted={handlePromptSubmitted}
            hasSubmitted={hasSubmittedPrompt}
          />
        )}

        {gamePhase === "generating" && <GeneratingPhase />}

        {gamePhase === "guessing" && self && (
          <GuessingPhase
            currentClerkId={self.id as string}
            roomCode={code}
            onGuessSubmitted={handleGuessSubmitted}
          />
        )}

        {gamePhase === "scoreboard" && (
          <Scoreboard isHost={isHost} onPlayAgain={handlePlayAgain} />
        )}
      </main>
    </div>
  );
}

export default function GamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);

  return (
    <RoomProvider
      id={`game-${code}`}
      initialPresence={{
        username: "",
        isReady: false,
      }}
      initialStorage={{
        gamePhase: "lobby",
        currentPromptIndex: 0,
        timerEndsAt: null,
        scores: [] as unknown as Storage["scores"],
        currentGuesses: [] as unknown as Storage["currentGuesses"],
        prompts: [] as unknown as Storage["prompts"],
        hostId: "",
        roundId: null,
      }}
    >
      <GameRoom code={code} />
    </RoomProvider>
  );
}
