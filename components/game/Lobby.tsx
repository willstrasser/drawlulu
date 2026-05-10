"use client";

import { useOthers, useSelf } from "@/liveblocks.config";
import { PlayerList } from "./PlayerList";
import { motion } from "motion/react";
import { useTransition } from "react";
import { log } from "@/lib/logger";
import { StampButton } from "@/components/ui/StampButton";
import { PhaseShell } from "@/components/ui/PhaseShell";

type LobbyProps = {
  roomCode: string;
  isHost: boolean;
  onStart: (playerUserIds: string[]) => Promise<void>;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
};

export function Lobby({
  roomCode,
  isHost,
  onStart,
  categories,
  selectedCategory,
  onSelectCategory,
}: LobbyProps) {
  const others = useOthers();
  const self = useSelf();
  const [starting, startStarting] = useTransition();

  const handleStart = () => {
    if (!self) return;
    const playerUserIds = [self.id, ...others.map((o) => o.id)].filter(
      Boolean,
    ) as string[];
    startStarting(async () => {
      try {
        await onStart(playerUserIds);
      } catch (e) {
        log.error("Lobby", "Failed to start", e);
      }
    });
  };

  const playerCount = others.length + 1;
  const canStart = isHost && playerCount >= 2 && selectedCategory !== "";

  return (
    <PhaseShell width="full" density="comfortable">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Game Lobby</h1>
        <div className="flex items-center justify-center gap-2">
          <span className="text-gray-600">Room Code:</span>
          <span className="text-2xl font-mono font-bold tracking-widest bg-surface/60 backdrop-blur-sm border-2 border-border/10 px-4 py-2 rounded-lg">
            {roomCode}
          </span>
        </div>
        <p className="text-gray-600 text-sm mt-2">
          Share this code with friends to join
        </p>
      </div>

      <div className="w-full max-w-sm">
        <PlayerList />
      </div>

      <div className="w-full max-w-sm">
        <h3 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide text-center">
          {isHost ? "Choose a Category" : "Category"}
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat, i) => (
            <motion.button
              key={cat}
              onClick={() => isHost && onSelectCategory(cat)}
              disabled={!isHost}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${
                selectedCategory === cat
                  ? "bg-primary text-white border-border"
                  : isHost
                    ? "bg-accent/10 border-accent text-accent hover:bg-accent/20"
                    : "bg-surface/60 border-border/10 text-gray-500 cursor-default"
              }`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 450,
                damping: 28,
                delay: i * 0.04,
              }}
              {...(isHost && { whileTap: { scale: 0.92 } })}
            >
              {cat}
            </motion.button>
          ))}
        </div>
        {!selectedCategory && !isHost && (
          <p className="text-gray-500 text-xs text-center mt-2">
            Waiting for host to pick a category...
          </p>
        )}
      </div>

      {isHost ? (
        <StampButton
          onClick={handleStart}
          disabled={!canStart || starting}
          variant="primary"
          size="lg"
        >
          {starting
            ? "Starting..."
            : playerCount < 2
              ? "Need at least 2 players"
              : !selectedCategory
                ? "Select a category"
                : "Start Game"}
        </StampButton>
      ) : (
        <p className="text-gray-600">Waiting for host to start the game...</p>
      )}
    </PhaseShell>
  );
}
