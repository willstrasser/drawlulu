"use client";

import { use, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
import { useSession } from "@/hooks/useSession";
import { useRouter } from "next/navigation";
import { Lobby } from "@/components/game/Lobby";
import { PromptPhase } from "@/components/game/PromptPhase";
import { GeneratingPhase } from "@/components/game/GeneratingPhase";
import { GuessingPhase } from "@/components/game/GuessingPhase";
import { Scoreboard } from "@/components/game/Scoreboard";
import { RevealPhase } from "@/components/game/RevealPhase";
import { DevPanel } from "@/components/game/DevPanel";
import { UsernameModal } from "@/components/game/UsernameModal";
import type { GamePhase } from "@/liveblocks.config";
import Link from "next/link";
import { useRoundData } from "@/hooks/useRoundData";
import { useGameTimer } from "@/hooks/useGameTimer";

function GameRoom({ code }: { code: string }) {
  const { user } = useSession();
  const self = useSelf();
  const others = useOthers();
  const router = useRouter();
  const gamePhase = useStorage((root) => root.gamePhase);
  const hostId = useStorage((root) => root.hostId);
  const currentPromptIndex = useStorage((root) => root.currentPromptIndex);
  const timerEndsAt = useStorage((root) => root.timerEndsAt);
  const selectedCategory = useStorage((root) => root.selectedCategory);
  const roundNumber = useStorage((root) => root.roundNumber);
  const newGameCode = useStorage((root) => root.newGameCode);
  const currentGuesses = useStorage((root) => root.currentGuesses);

  const [myPresence, setMyPresence] = useMyPresence();

  // Presence is the source of truth; derive locally to avoid duplicate state
  const hasSubmittedPrompt = myPresence?.hasSubmittedPrompt ?? false;

  const isHost = self?.id === hostId;
  const storageLoaded = gamePhase !== null;

  const [categories, setCategories] = useState<string[]>([]);
  // Authoritative host user ID fetched from the DB — eliminates the race
  // condition where any player who connects first could win the hostId write.
  const [hostUserId, setHostUserId] = useState<string>("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, []);

  useEffect(() => {
    fetch(`/api/games/${code}`)
      .then((r) => {
        if (!r.ok) throw new Error(`GET /api/games/${code} → ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.hostUserId) setHostUserId(d.hostUserId);
      })
      .catch((e) => console.error("[GameRoom] hostUserId fetch failed:", e));
  }, [code]);

  // Set username on join
  useEffect(() => {
    if (user) {
      setMyPresence({
        username: user.username,
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

  const setRoundNumber = useMutation(({ storage }, n: number) => {
    storage.set("roundNumber", n);
  }, []);

  const setNewGameCode = useMutation(({ storage }, code: string) => {
    storage.set("newGameCode", code);
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

  // Set host — only runs when the API-verified hostUserId confirms this user
  // is the actual host, avoiding the first-writer race condition.
  useEffect(() => {
    if (storageLoaded && hostUserId && self?.id === hostUserId) {
      setHostIdMutation(self.id as string);
    }
  }, [storageLoaded, self, hostUserId, setHostIdMutation]);

  const {
    myAssignment,
    prompts,
    roundScores,
    cumulativeScores,
    promptBreakdowns,
  } = useRoundData({
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
  const handleStart = async (playerUserIds: string[]) => {
    const res = await fetch(`/api/games/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerUserIds, category: selectedCategory }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

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

  // Redirect all non-host players when host starts a new game
  useEffect(() => {
    if (newGameCode && newGameCode !== code) {
      router.push(`/game/${newGameCode}`);
    }
  }, [newGameCode, code, router]);

  const handleGuessSubmitted = (guess: GuessEntry) => {
    addGuess(guess);
  };

  const handlePlayAgain = async () => {
    const allUserIds = [self?.id, ...others.map((o) => o.id)].filter(
      Boolean,
    ) as string[];
    await handleStart(allUserIds);
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

  const allowListUserIds = process.env.DEV_USER_IDS?.split(",") || [];
  const showDevPanel =
    process.env.NODE_ENV === "development" ||
    allowListUserIds.includes(user?.userId ?? "");

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
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            Draw<span className="text-riso-teal">lulu</span>
          </Link>
          {roundNumber != null && roundNumber > 1 && (
            <span className="text-sm text-gray-500">Round {roundNumber}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{myPresence?.username}</span>
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center p-4 sm:p-8 min-h-[calc(100vh-57px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={gamePhase ?? "loading"}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="flex flex-col items-center justify-center w-full"
          >
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

            {gamePhase === PHASE.GENERATING && (
              <GeneratingPhase isHost={isHost} onSkip={handleSkipGeneration} />
            )}

            {gamePhase === PHASE.GUESSING && (
              <GuessingPhase
                roomCode={code}
                prompts={prompts}
                currentPromptIndex={currentPromptIndex ?? 0}
                onGuessSubmitted={handleGuessSubmitted}
                category={selectedCategory ?? ""}
              />
            )}

            {gamePhase === PHASE.REVEALING && prompts && (
              <RevealPhase
                prompt={prompts[currentPromptIndex ?? 0]}
                correctGuesses={(currentGuesses ?? []).filter(
                  (g) => g.isCorrect,
                )}
              />
            )}

            {gamePhase === PHASE.SCOREBOARD && (
              <Scoreboard
                isHost={isHost}
                roundNumber={roundNumber ?? 1}
                roundScores={roundScores}
                cumulativeScores={cumulativeScores}
                promptBreakdowns={promptBreakdowns}
                onPlayAgain={handlePlayAgain}
                onNewGame={handleNewGame}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function GamePageInner({ code }: { code: string }) {
  const { user, loading, refresh } = useSession();

  if (loading) {
    return (
      <div className="relative z-10 min-h-screen text-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-riso-teal border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatePresence>
        <UsernameModal onComplete={() => refresh()} />
      </AnimatePresence>
    );
  }

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
        roundNumber: 1,
        newGameCode: "",
      }}
    >
      <GameRoom code={code} />
    </RoomProvider>
  );
}

export default function GamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  return <GamePageInner code={code} />;
}
