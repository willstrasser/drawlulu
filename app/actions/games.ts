"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { games } from "@/lib/db/schema";
import { generateRoomCode } from "@/lib/utils";
import { PHASE } from "@/lib/phases";
import { getUser } from "@/lib/get-user";
import { checkRateLimit } from "@/lib/rate-limit";

export type ActionState = { error: string | null };
export const initialActionState: ActionState = { error: null };

function isUniqueViolation(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const cause = (e as { cause?: unknown }).cause;
  if (typeof cause !== "object" || cause === null) return false;
  return (cause as { code?: string }).code === "23505";
}

export async function createGameAction(): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sign in first" };

  if (!checkRateLimit(`create-game:${user.userId}`, 5, 60_000)) {
    return { error: "Too many requests, slow down for a minute." };
  }

  let game: typeof games.$inferSelect | undefined;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const [inserted] = await db
        .insert(games)
        .values({
          roomCode: generateRoomCode(),
          hostId: user.userId,
          status: PHASE.LOBBY,
        })
        .returning();
      game = inserted;
      break;
    } catch (e: unknown) {
      if (isUniqueViolation(e)) continue;
      throw e;
    }
  }

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
