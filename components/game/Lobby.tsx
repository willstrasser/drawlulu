"use client";

import { useOthers, useSelf } from "@/liveblocks.config";
import { PlayerList } from "./PlayerList";
import { useState } from "react";

type LobbyProps = {
  roomCode: string;
  isHost: boolean;
  onStart: (playerClerkIds: string[]) => Promise<void>;
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
      const playerClerkIds = [
        self.id,
        ...others.map((o) => o.id),
      ].filter(Boolean) as string[];
      await onStart(playerClerkIds);
    } catch (e) {
      console.error("Failed to start:", e);
      setStarting(false);
    }
  };

  const playerCount = others.length + 1;
  const canStart = isHost && playerCount >= 2 && selectedCategory !== "";

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Game Lobby</h1>
        <div className="flex items-center justify-center gap-2">
          <span className="text-gray-400">Room Code:</span>
          <span className="text-2xl font-mono font-bold tracking-widest bg-white/10 px-4 py-2 rounded-lg">
            {roomCode}
          </span>
        </div>
        <p className="text-gray-400 text-sm mt-2">
          Share this code with friends to join
        </p>
      </div>

      <div className="w-full max-w-sm">
        <PlayerList />
      </div>

      <div className="w-full max-w-sm">
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide text-center">
          {isHost ? "Choose a Category" : "Category"}
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => isHost && onSelectCategory(cat)}
              disabled={!isHost}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-green-600 text-white"
                  : isHost
                    ? "bg-white/10 text-gray-300 hover:bg-white/20"
                    : "bg-white/5 text-gray-500 cursor-default"
              }`}
            >
              {cat}
            </button>
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
          className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-colors"
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
        <p className="text-gray-400">Waiting for host to start the game...</p>
      )}
    </div>
  );
}
