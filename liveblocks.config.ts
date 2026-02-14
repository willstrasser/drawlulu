import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

export type Presence = {
  username: string;
  imageUrl?: string;
  isReady: boolean;
};

export type GamePhase =
  | "lobby"
  | "prompting"
  | "generating"
  | "guessing"
  | "scoreboard";

export type PlayerScore = {
  userId: string;
  username: string;
  score: number;
};

export type GuessEntry = {
  userId: string;
  username: string;
  guessText: string;
  isCorrect: boolean;
  pointsAwarded: number;
  timestamp: number;
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

export type Storage = {
  gamePhase: GamePhase;
  currentPromptIndex: number;
  timerEndsAt: number | null;
  scores: PlayerScore[];
  currentGuesses: GuessEntry[];
  prompts: PromptEntry[];
  hostId: string;
  roundId: string | null;
};

export type UserMeta = {
  id: string; // Clerk user ID, set by liveblocks.prepareSession(userId)
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
