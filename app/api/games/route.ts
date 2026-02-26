import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateRoomCode } from "@/lib/utils";
import { PHASE } from "@/lib/phases";
import { ensureUser } from "@/lib/ensure-user";

export async function POST() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await ensureUser(clerkId);

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
      hostId: dbUser.id,
      status: PHASE.LOBBY,
    })
    .returning();

  return NextResponse.json({ roomCode: game.roomCode });
}
