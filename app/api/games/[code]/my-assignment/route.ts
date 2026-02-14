import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, prompts, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.roomCode, code));

  if (!game || !game.currentRoundId) {
    return NextResponse.json({ error: "No active round" }, { status: 404 });
  }

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [prompt] = await db
    .select()
    .from(prompts)
    .where(
      and(
        eq(prompts.roundId, game.currentRoundId),
        eq(prompts.userId, dbUser.id)
      )
    );

  if (!prompt) {
    return NextResponse.json({ error: "No assignment found" }, { status: 404 });
  }

  return NextResponse.json({
    promptId: prompt.id,
    targetWord: prompt.targetWord,
    tabooWords: prompt.tabooWords,
  });
}
