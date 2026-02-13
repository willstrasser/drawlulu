import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
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

  // Check game exists and is in lobby
  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.roomCode, code));

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "lobby") {
    return NextResponse.json(
      { error: "Game already in progress" },
      { status: 400 }
    );
  }

  return NextResponse.json({ roomCode: game.roomCode, gameId: game.id });
}
