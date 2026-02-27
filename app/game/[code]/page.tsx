"use client";

import { use, useEffect, useState } from "react";
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
import { Lobby } from "@/components/game/Lobby";
import { PromptPhase } from "@/components/game/PromptPhase";
import { GeneratingPhase } from "@/components/game/GeneratingPhase";
import { GuessingPhase } from "@/components/game/GuessingPhase";
import { Scoreboard } from "@/components/game/Scoreboard";
import { DevPanel, DEV_PANEL_USER_IDS } from "@/components/game/DevPanel";
import type { GamePhase } from "@/liveblocks.config";
import Link from "next/link";
import Image from "next/image";
import { useRoundData } from "@/hooks/useRoundData";
import { useGameTimer } from "@/hooks/useGameTimer";

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

  // Presence is the source of truth; derive locally to avoid duplicate state
  const hasSubmittedPrompt = myPresence?.hasSubmittedPrompt ?? false;

  const isHost = self?.id === hostId;
  const storageLoaded = gamePhase !== null;

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, []);

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
      storage.set("currentGuesses", [
        guess,
      ] as unknown as Storage["currentGuesses"]);
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

  const { myAssignment, prompts, scores, promptBreakdowns } = useRoundData({
    gamePhase,
    code,
    setMyPresence,
  });

  useGameTimer({
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
  });

  // Handle game start (host only)
  const handleStart = async (playerClerkIds: string[]) => {
    const res = await fetch(`/api/games/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerClerkIds, category: selectedCategory }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setMyPresence({ hasSubmittedPrompt: false });
    setGamePhase(PHASE.PROMPTING);
    setTimerEndsAt(Date.now() + 60000);
  };

  const handleGuessSubmitted = (guess: GuessEntry) => {
    addGuess(guess);
  };

  const handlePlayAgain = async () => {
    const allClerkIds = [self?.id, ...others.map((o) => o.id)].filter(
      Boolean,
    ) as string[];
    await handleStart(allClerkIds);
  };

  const handlePromptSubmitted = () => {
    setMyPresence({ hasSubmittedPrompt: true });
  };

  // Skip timer when all players have submitted prompts
  const allSubmitted =
    gamePhase === PHASE.PROMPTING &&
    self?.presence.hasSubmittedPrompt &&
    others.every((o) => o.presence.hasSubmittedPrompt);

  useEffect(() => {
    if (
      isHost &&
      allSubmitted &&
      timerEndsAt &&
      timerEndsAt > Date.now() + 500
    ) {
      // Expire the timer immediately — the existing timer effect will pick it up
      setTimerEndsAt(Date.now());
    }
  }, [isHost, allSubmitted, timerEndsAt, setTimerEndsAt]);

  if (!storageLoaded) {
    return (
      <div className="relative z-10 min-h-screen text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-riso-teal border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Connecting to room...</p>
        </div>
      </div>
    );
  }

  const showDevPanel =
    process.env.NODE_ENV === "development" ||
    (user?.id && DEV_PANEL_USER_IDS.has(user.id));

  return (
    <div className="relative z-10 min-h-screen text-gray-900">
      {showDevPanel && (
        <DevPanel
          code={code}
          prompts={prompts}
          onExpireTimer={() => setTimerEndsAt(Date.now())}
          onSetPhase={(phase: GamePhase) => setGamePhase(phase)}
        />
      )}
      <nav className="border-b border-gray-900/10 px-6 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          Draw<span className="text-riso-teal">lulu</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{myPresence?.username}</span>
          {user?.imageUrl && (
            <Image
              src={user.imageUrl}
              alt=""
              className="h-8 w-8 rounded-full"
              width={32}
              height={32}
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
            categories={categories}
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
            <div className="animate-spin h-8 w-8 border-4 border-riso-teal border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading your assignment...</p>
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
