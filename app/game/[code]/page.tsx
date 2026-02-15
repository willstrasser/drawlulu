"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import {
  RoomProvider,
  useMyPresence,
  useStorage,
  useMutation,
  useOthers,
  useSelf,
} from "@/liveblocks.config";
import { PHASE } from "@/liveblocks.config";
import type { GuessEntry, Storage } from "@/liveblocks.config";
import { useUser } from "@clerk/nextjs";
import { getCategories } from "@/lib/words";
import { Lobby } from "@/components/game/Lobby";
import { PromptPhase } from "@/components/game/PromptPhase";
import { GeneratingPhase } from "@/components/game/GeneratingPhase";
import { GuessingPhase } from "@/components/game/GuessingPhase";
import { Scoreboard } from "@/components/game/Scoreboard";
import { DevPanel, DEV_PANEL_USER_IDS } from "@/components/game/DevPanel";
import type { GamePhase } from "@/liveblocks.config";

type MyAssignment = {
  promptId: string;
  targetWord: string;
  tabooWords: string[];
};

export type PromptEntry = {
  promptId: string;
  userId: string;
  username: string;
  targetWord: string;
  tabooWords: string[];
  imageUrl: string | null;
  forbiddenWordsUsed: string[];
};

export type PlayerScore = {
  userId: string;
  username: string;
  score: number;
};

export type PromptBreakdown = {
  promptId: string;
  prompter: string;
  targetWord: string;
  imageUrl: string | null;
  forbiddenWordsUsed: string[];
  prompterPoints: number;
  correctGuesses: { username: string; points: number }[];
};

function GameRoom({ code }: { code: string }) {
  const { user } = useUser();
  const self = useSelf();
  const others = useOthers();
  const gamePhase = useStorage((root) => root.gamePhase);
  const hostId = useStorage((root) => root.hostId);
  const currentPromptIndex = useStorage((root) => root.currentPromptIndex);
  const timerEndsAt = useStorage((root) => root.timerEndsAt);
  const selectedCategory = useStorage((root) => root.selectedCategory);

  const [myPresence, setMyPresence] = useMyPresence();
  const [hasSubmittedPrompt, setHasSubmittedPrompt] = useState(false);
  const [myAssignment, setMyAssignment] = useState<MyAssignment | null>(null);
  const [fetchingAssignment, setFetchingAssignment] = useState(false);

  // DB-sourced state (fetched per phase)
  const [prompts, setPrompts] = useState<PromptEntry[] | null>(null);
  const [scores, setScores] = useState<PlayerScore[] | null>(null);
  const [promptBreakdowns, setPromptBreakdowns] = useState<PromptBreakdown[] | null>(null);

  const isHost = self?.id === hostId;
  const storageLoaded = gamePhase !== null;

  // Set username on join
  useEffect(() => {
    if (user) {
      setMyPresence({
        username: user.username || user.firstName || "Player",
        imageUrl: user.imageUrl,
        isReady: false,
        hasSubmittedPrompt: false,
      });
    }
  }, [user, setMyPresence]);

  // Liveblocks mutations (only ephemeral state)
  const setGamePhase = useMutation(({ storage }, phase: string) => {
    storage.set("gamePhase", phase as Storage["gamePhase"]);
  }, []);

  const setTimerEndsAt = useMutation(({ storage }, endsAt: number | null) => {
    storage.set("timerEndsAt", endsAt);
  }, []);

  const setCurrentPromptIndex = useMutation(({ storage }, index: number) => {
    storage.set("currentPromptIndex", index);
  }, []);

  const setHostIdMutation = useMutation(({ storage }, id: string) => {
    storage.set("hostId", id);
  }, []);

  const setSelectedCategory = useMutation(({ storage }, category: string) => {
    storage.set("selectedCategory", category);
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

  // Reset round-specific state whenever we enter "prompting" (including Play Again)
  const prevPhaseRef = useRef(gamePhase);
  useEffect(() => {
    if (gamePhase === PHASE.PROMPTING && prevPhaseRef.current !== PHASE.PROMPTING) {
      setMyAssignment(null);
      setFetchingAssignment(false);
      setHasSubmittedPrompt(false);
      setMyPresence({ hasSubmittedPrompt: false });
      setPrompts(null);
      setScores(null);
      setPromptBreakdowns(null);
    }
    prevPhaseRef.current = gamePhase;
  }, [gamePhase]);

  // Fetch assignment when phase changes to "prompting"
  useEffect(() => {
    if (gamePhase === PHASE.PROMPTING && !myAssignment && !fetchingAssignment) {
      setFetchingAssignment(true);
      fetch(`/api/games/${code}/my-assignment`)
        .then((res) => res.json())
        .then((data) => {
          if (data.promptId) {
            setMyAssignment(data);
            setHasSubmittedPrompt(false);
          }
        })
        .catch((e) => console.error("Failed to fetch assignment:", e))
        .finally(() => setFetchingAssignment(false));
    }
    if (gamePhase !== PHASE.PROMPTING && gamePhase !== PHASE.GENERATING) {
      setMyAssignment(null);
    }
  }, [gamePhase, code, myAssignment, fetchingAssignment]);

  // Fetch prompts from DB when phase changes to "guessing"
  useEffect(() => {
    if (gamePhase === PHASE.GUESSING && !prompts) {
      fetch(`/api/games/${code}/round-prompts`)
        .then((res) => res.json())
        .then((data) => {
          if (data.prompts) setPrompts(data.prompts);
        })
        .catch((e) => console.error("Failed to fetch prompts:", e));
    }
    if (gamePhase === PHASE.LOBBY) {
      setPrompts(null);
    }
  }, [gamePhase, code, prompts]);

  // Fetch scores from DB when phase changes to "scoreboard"
  useEffect(() => {
    if (gamePhase === PHASE.SCOREBOARD && !scores) {
      fetch(`/api/games/${code}/scores`)
        .then((res) => res.json())
        .then((data) => {
          if (data.scores) setScores(data.scores);
          if (data.promptBreakdowns) setPromptBreakdowns(data.promptBreakdowns);
        })
        .catch((e) => console.error("Failed to fetch scores:", e));
    }
    if (gamePhase === PHASE.LOBBY) {
      setScores(null);
      setPromptBreakdowns(null);
    }
  }, [gamePhase, code, scores]);

  // Handle game start (host only)
  const handleStart = async (playerClerkIds: string[]) => {
    const res = await fetch(`/api/games/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerClerkIds, category: selectedCategory }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setPrompts(null);
    setScores(null);
    setPromptBreakdowns(null);
    setMyPresence({ hasSubmittedPrompt: false });
    setGamePhase(PHASE.PROMPTING);
    setTimerEndsAt(Date.now() + 60000);
  };

  // Timer check for phase transitions (host only)
  const phaseTransitionRef = useRef(false);
  const gamePhaseRef = useRef(gamePhase);
  const currentPromptIndexRef = useRef(currentPromptIndex);
  const promptsRef = useRef(prompts);

  // Keep refs in sync
  gamePhaseRef.current = gamePhase;
  currentPromptIndexRef.current = currentPromptIndex;
  promptsRef.current = prompts;

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
      const nextIndex = idx + 1;
      if (currentPrompts && nextIndex < currentPrompts.length) {
        setCurrentPromptIndex(nextIndex);
        clearGuesses();
        setTimerEndsAt(Date.now() + 30000);
      } else {
        setGamePhase(PHASE.SCOREBOARD);
        setTimerEndsAt(null);
      }
    }

    phaseTransitionRef.current = false;
  }, [code]);

  useEffect(() => {
    if (!isHost || !timerEndsAt) return;

    const timeLeft = timerEndsAt - Date.now();
    if (timeLeft <= 0) {
      handleTimerEnd();
      return;
    }

    const timeout = setTimeout(handleTimerEnd, timeLeft);
    return () => clearTimeout(timeout);
  }, [isHost, timerEndsAt, handleTimerEnd]);

  const handleGuessSubmitted = (guess: GuessEntry) => {
    addGuess(guess);
  };

  const handlePlayAgain = async () => {
    const allClerkIds = [
      self?.id,
      ...others.map((o) => o.id),
    ].filter(Boolean) as string[];
    await handleStart(allClerkIds);
  };

  const handlePromptSubmitted = () => {
    setHasSubmittedPrompt(true);
    setMyPresence({ hasSubmittedPrompt: true });
  };

  // Skip timer when all players have submitted prompts
  const allSubmitted =
    gamePhase === PHASE.PROMPTING &&
    self?.presence.hasSubmittedPrompt &&
    others.every((o) => o.presence.hasSubmittedPrompt);

  useEffect(() => {
    if (isHost && allSubmitted && timerEndsAt && timerEndsAt > Date.now() + 500) {
      // Expire the timer immediately — the existing timer effect will pick it up
      setTimerEndsAt(Date.now());
    }
  }, [isHost, allSubmitted]);

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

  const showDevPanel =
    process.env.NODE_ENV === "development" ||
    (user?.id && DEV_PANEL_USER_IDS.has(user.id));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {showDevPanel && (
        <DevPanel
          code={code}
          prompts={prompts}
          onExpireTimer={() => setTimerEndsAt(Date.now())}
          onSetPhase={(phase: GamePhase) => setGamePhase(phase)}
        />
      )}
      <nav className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <a href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
          Draw<span className="text-green-400">lulu</span>
        </a>
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
        {gamePhase === PHASE.LOBBY && (
          <Lobby
            roomCode={code}
            isHost={isHost}
            onStart={handleStart}
            categories={getCategories()}
            selectedCategory={selectedCategory ?? ""}
            onSelectCategory={setSelectedCategory}
          />
        )}

        {gamePhase === PHASE.PROMPTING && myAssignment && (
          <PromptPhase
            targetWord={myAssignment.targetWord}
            tabooWords={myAssignment.tabooWords}
            promptId={myAssignment.promptId}
            roomCode={code}
            onSubmitted={handlePromptSubmitted}
            hasSubmitted={hasSubmittedPrompt}
            category={selectedCategory ?? ""}
          />
        )}

        {gamePhase === PHASE.PROMPTING && !myAssignment && (
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading your assignment...</p>
          </div>
        )}

        {gamePhase === PHASE.GENERATING && <GeneratingPhase />}

        {gamePhase === PHASE.GUESSING && (
          <GuessingPhase
            roomCode={code}
            prompts={prompts}
            currentPromptIndex={currentPromptIndex ?? 0}
            onGuessSubmitted={handleGuessSubmitted}
            category={selectedCategory ?? ""}
          />
        )}

        {gamePhase === PHASE.SCOREBOARD && (
          <Scoreboard
            isHost={isHost}
            scores={scores}
            promptBreakdowns={promptBreakdowns}
            onPlayAgain={handlePlayAgain}
          />
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
        hasSubmittedPrompt: false,
      }}
      initialStorage={{
        gamePhase: PHASE.LOBBY,
        currentPromptIndex: 0,
        timerEndsAt: null,
        currentGuesses: [] as unknown as Storage["currentGuesses"],
        hostId: "",
        selectedCategory: "",
      }}
    >
      <GameRoom code={code} />
    </RoomProvider>
  );
}
