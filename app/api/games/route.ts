import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateRoomCode } from "@/lib/utils";
import { PHASE } from "@/lib/phases";
import { getUser } from "@/lib/get-user";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(`create-game:${user.userId}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Generate unique room code
  let roomCode: string;
  let attempts = 0;
  do {
    roomCode = generateRoomCode();
    const existing = await db
      .select()
      .from(games)
      .where(eq(games.roomCode, roomCode));
    if (existing.length === 0) break;
    attempts++;
  } while (attempts < 10);

  const [game] = await db
    .insert(games)
    .values({
      roomCode,
      hostId: user.userId,
      status: PHASE.LOBBY,
    })
    .returning();

  return NextResponse.json({ roomCode: game.roomCode });
}
