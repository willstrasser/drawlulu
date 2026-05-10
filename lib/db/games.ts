import { db } from "@/lib/db";
import { games } from "@/lib/db/schema";
import { generateRoomCode } from "@/lib/utils";
import { PHASE } from "@/lib/phases";

export type GameRow = typeof games.$inferSelect;

function isUniqueViolation(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const cause = (e as { cause?: unknown }).cause;
  if (typeof cause !== "object" || cause === null) return false;
  return (cause as { code?: string }).code === "23505";
}

/**
 * Insert a new lobby game with a freshly-generated room code.
 *
 * The room-code space (6 chars from a 32-char alphabet) is small enough
 * that collisions are possible under load, so we retry up to 10 times on
 * the unique-key violation. Any other error bubbles.
 *
 * Returns the inserted row, or `null` if every retry collided.
 */
export async function createLobbyGame(
  hostUserId: string,
): Promise<GameRow | null> {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const [inserted] = await db
        .insert(games)
        .values({
          roomCode: generateRoomCode(),
          hostId: hostUserId,
          status: PHASE.LOBBY,
        })
        .returning();
      if (inserted) return inserted;
    } catch (e: unknown) {
      if (isUniqueViolation(e)) continue;
      throw e;
    }
  }
  return null;
}
