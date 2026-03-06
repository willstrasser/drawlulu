"use client";

import { useOthers, useSelf } from "@/liveblocks.config";
import { PlayerList } from "./PlayerList";
import { motion } from "motion/react";
import { useState } from "react";

type LobbyProps = {
  roomCode: string;
  isHost: boolean;
  onStart: (playerUserIds: string[]) => Promise<void>;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
};

export function Lobby({ roomCode, isHost, onStart, categories, selectedCategory, onSelectCategory }: LobbyProps) {
  const others = useOthers();
  const self = useSelf();
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    if (!self) return;
    setStarting(true);
    try {
      const playerUserIds = [
        self.id,
        ...others.map((o) => o.id),
      ].filter(Boolean) as string[];
      await onStart(playerUserIds);
    } catch (e) {
      console.error("Failed to start:", e);
      setStarting(false);
    }
  };

  const playerCount = others.length + 1;
  const canStart = isHost && playerCount >= 2 && selectedCategory !== "";

  return (
    <div className="flex flex-col items-center gap-5 sm:gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Game Lobby</h1>
        <div className="flex items-center justify-center gap-2">
          <span className="text-gray-600">Room Code:</span>
          <span className="text-2xl font-mono font-bold tracking-widest bg-white/60 backdrop-blur-sm border-2 border-gray-900/10 px-4 py-2 rounded-lg">
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
                  ? "bg-riso-teal text-white border-gray-900"
                  : isHost
                    ? "bg-riso-purple/10 border-riso-purple text-riso-purple hover:bg-riso-purple/20"
                    : "bg-white/60 border-gray-900/10 text-gray-500 cursor-default"
              }`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 450, damping: 28, delay: i * 0.04 }}
              whileTap={isHost ? { scale: 0.92 } : undefined}
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
        <button
          onClick={handleStart}
          disabled={!canStart || starting}
          className="px-8 py-3 bg-riso-teal text-white border-2 border-gray-900 rounded-xl font-bold text-lg shadow-[4px_4px_0_theme(colors.gray.900)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_theme(colors.gray.900)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed transition-all"
        >
          {starting
            ? "Starting..."
            : playerCount < 2
              ? "Need at least 2 players"
              : !selectedCategory
                ? "Select a category"
                : "Start Game"}
        </button>
      ) : (
        <p className="text-gray-600">Waiting for host to start the game...</p>
      )}
    </div>
  );
}
