import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateRoomCode } from "@/lib/utils";
import { PHASE } from "@/lib/phases";

export async function POST() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Upsert user
  let [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));

  if (!dbUser) {
    [dbUser] = await db
      .insert(users)
      .values({
        clerkId,
        username: clerkUser.username || clerkUser.firstName || "Player",
        imageUrl: clerkUser.imageUrl,
      })
      .returning();
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
      hostId: dbUser.id,
      status: PHASE.LOBBY,
    })
    .returning();

  return NextResponse.json({ roomCode: game.roomCode });
}
