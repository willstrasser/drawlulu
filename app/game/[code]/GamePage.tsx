"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  RoomProvider,
  useMyPresence,
  useStorage,
  useOthers,
  useSelf,
  PHASE,
} from "@/liveblocks.config";
import type { GuessEntry, GamePhase } from "@/liveblocks.config";
import { useSession } from "@/hooks/useSession";
import { useRouter } from "next/navigation";
import { DevPanel } from "@/components/game/DevPanel";
import { UsernameModal } from "@/components/game/UsernameModal";
import { RoomErrorBoundary } from "@/components/game/RoomErrorBoundary";
import Link from "next/link";
import { useRoundData } from "@/hooks/useRoundData";
import { useGameTimer } from "@/hooks/useGameTimer";
import { useStorageMutations } from "@/hooks/useStorageMutations";
import { useGameMeta } from "@/hooks/useGameMeta";
import { useGameActions } from "@/hooks/useGameActions";
import { PHASE_SPRING } from "@/components/ui/motion-presets";
import { PhaseRouter } from "./PhaseRouter";

function GameRoom({
  code,
  showDevPanel,
}: {
  code: string;
  showDevPanel: boolean;
}) {
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
  const hasSubmittedPrompt = myPresence?.hasSubmittedPrompt ?? false;

  const isHost = self?.id === hostId;
  const storageLoaded = gamePhase !== null;

  const { categories, hostUserId } = useGameMeta(code);

  const mutations = useStorageMutations();
  const {
    setGamePhase,
    setTimerEndsAt,
    setCurrentPromptIndex,
    setHostId,
    setSelectedCategory,
    clearGuesses,
  } = mutations;

  const {
    handleStart,
    handleNewGame,
    handleGuessSubmitted,
    handlePromptSubmitted,
    handleSkipGeneration,
  } = useGameActions({
    code,
    selectedCategory,
    setMyPresence,
    storageMutations: mutations,
  });

  const handlePlayAgain = async () => {
    const allUserIds = [self?.id, ...others.map((o) => o.id)].filter(
      (id): id is string => Boolean(id),
    );
    await handleStart(allUserIds);
  };

  // Set username on join
  useEffect(() => {
    if (user) {
      setMyPresence({
        username: user.username,
        ...(user.imageUrl !== undefined && { imageUrl: user.imageUrl }),
        isReady: false,
        hasSubmittedPrompt: false,
      });
    }
  }, [user, setMyPresence]);

  // Authoritative host ID — only the verified DB host writes to storage,
  // closing the first-writer race that previously elected whichever player
  // connected first.
  useEffect(() => {
    if (storageLoaded && hostUserId && self?.id === hostUserId) {
      setHostId(self.id);
    }
  }, [storageLoaded, self, hostUserId, setHostId]);

  // Non-host clients follow the host into a freshly created game.
  useEffect(() => {
    if (newGameCode && newGameCode !== code) {
      router.push(`/game/${newGameCode}`);
    }
  }, [newGameCode, code, router]);

  const {
    myAssignment,
    prompts,
    roundScores,
    cumulativeScores,
    promptBreakdowns,
    fetchError,
  } = useRoundData({ gamePhase, code, setMyPresence });

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

  // Skip timer when all players have submitted their prompts.
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
      setTimerEndsAt(Date.now());
    }
  }, [isHost, allSubmitted, timerEndsAt, setTimerEndsAt]);

  if (!storageLoaded) {
    return (
      <div className="relative z-10 min-h-screen text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen text-foreground">
      {showDevPanel && (
        <DevPanel
          code={code}
          prompts={prompts}
          onExpireTimer={() => setTimerEndsAt(Date.now())}
          onSetPhase={(phase: GamePhase) => setGamePhase(phase)}
        />
      )}
      <nav className="border-b border-border/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            Draw<span className="text-primary">lulu</span>
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
            transition={PHASE_SPRING}
            className="flex flex-col items-center justify-center w-full"
          >
            <PhaseRouter
              gamePhase={gamePhase}
              isHost={isHost}
              code={code}
              currentPromptIndex={currentPromptIndex}
              currentGuesses={currentGuesses}
              roundNumber={roundNumber}
              selectedCategory={selectedCategory}
              myAssignment={myAssignment}
              prompts={prompts}
              roundScores={roundScores}
              cumulativeScores={cumulativeScores}
              promptBreakdowns={promptBreakdowns}
              fetchError={fetchError}
              hasSubmittedPrompt={hasSubmittedPrompt}
              categories={categories}
              onStart={handleStart}
              onSelectCategory={setSelectedCategory}
              onPromptSubmitted={handlePromptSubmitted}
              onGuessSubmitted={handleGuessSubmitted}
              onSkipGeneration={handleSkipGeneration}
              onPlayAgain={handlePlayAgain}
              onNewGame={handleNewGame}
            />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function GamePageInner({
  code,
  showDevPanel,
}: {
  code: string;
  showDevPanel: boolean;
}) {
  const { user, loading, refresh } = useSession();

  if (loading) {
    return (
      <div className="relative z-10 min-h-screen text-foreground flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
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
    <RoomErrorBoundary>
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
          currentGuesses: [] satisfies GuessEntry[],
          hostId: "",
          selectedCategory: "",
          roundNumber: 1,
          newGameCode: "",
        }}
      >
        <GameRoom code={code} showDevPanel={showDevPanel} />
      </RoomProvider>
    </RoomErrorBoundary>
  );
}

export default function GamePage({
  code,
  showDevPanel,
}: {
  code: string;
  showDevPanel: boolean;
}) {
  return <GamePageInner code={code} showDevPanel={showDevPanel} />;
}
