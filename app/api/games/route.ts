import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games } from "@/lib/db/schema";
import { generateRoomCode } from "@/lib/utils";
import { PHASE } from "@/lib/phases";
import { getUser } from "@/lib/get-user";
import { checkRateLimit } from "@/lib/rate-limit";

function isUniqueViolation(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const cause = (e as { cause?: unknown }).cause;
  if (typeof cause !== "object" || cause === null) return false;
  return (cause as { code?: string }).code === "23505";
}

export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(`create-game:${user.userId}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Insert with a fresh random code; retry on the rare duplicate key collision.
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

  if (!game) {
    return NextResponse.json(
      { error: "Failed to generate room code" },
      { status: 500 },
    );
  }

  return NextResponse.json({ roomCode: game.roomCode });
}
