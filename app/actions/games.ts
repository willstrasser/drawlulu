"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { games } from "@/lib/db/schema";
import { PHASE } from "@/lib/phases";
import { getUser } from "@/lib/get-user";
import { checkRateLimit } from "@/lib/rate-limit";
import { createLobbyGame } from "@/lib/db/games";

export type ActionState = { error: string | null };
export const initialActionState: ActionState = { error: null };

export async function createGameAction(): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sign in first" };

  if (!checkRateLimit(`create-game:${user.userId}`, 5, 60_000)) {
    return { error: "Too many requests, slow down for a minute." };
  }

  const game = await createLobbyGame(user.userId);
  if (!game) return { error: "Failed to generate room code" };

  redirect(`/game/${game.roomCode}`);
}

export async function joinGameAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sign in first" };

  const raw = formData.get("code");
  const code = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (!code) return { error: "Enter a room code" };

  const [game] = await db.select().from(games).where(eq(games.roomCode, code));
  if (!game) return { error: "Game not found" };
  if (game.status !== PHASE.LOBBY) {
    return { error: "Game already in progress" };
  }

  redirect(`/game/${game.roomCode}`);
}
