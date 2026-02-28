import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

export type Presence = {
  username: string;
  imageUrl?: string;
  isReady: boolean;
  // the following values will change over the course of the gameplay
  hasSubmittedPrompt: boolean;
};

import type { GamePhase } from "@/lib/phases";
export { PHASE } from "@/lib/phases";
export type { GamePhase } from "@/lib/phases";

export type GuessEntry = {
  userId: string;
  username: string;
  guessText: string;
  isCorrect: boolean;
  pointsAwarded: number;
  timestamp: number;
};

export type Storage = {
  gamePhase: GamePhase;
  currentPromptIndex: number;
  timerEndsAt: number | null;
  currentGuesses: GuessEntry[];
  hostId: string;
  selectedCategory: string;
  roundNumber: number;
  newGameCode: string;
};

export type UserMeta = {
  id: string; // User UUID from our DB, set by liveblocks.prepareSession(userId)
  info: {
    username: string;
    imageUrl?: string;
  };
};

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useOthers,
  useSelf,
  useStorage,
  useMutation,
  useBroadcastEvent,
  useEventListener,
} = createRoomContext<Presence, Storage, UserMeta>(client);
