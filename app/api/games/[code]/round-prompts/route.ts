import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, prompts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
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

  const roundPrompts = await db
    .select()
    .from(prompts)
    .where(eq(prompts.roundId, game.currentRoundId));

  const promptsWithUsers = await Promise.all(
    roundPrompts.map(async (p) => {
      const [user] = await db.select().from(users).where(eq(users.id, p.userId));
      return {
        promptId: p.id,
        userId: user?.clerkId || "",
        username: user?.username || "Unknown",
        targetWord: p.targetWord,
        tabooWords: p.tabooWords,
        imageUrl: p.imageUrl,
        forbiddenWordsUsed: p.forbiddenWordsUsed || [],
      };
    })
  );

  return NextResponse.json({ prompts: promptsWithUsers });
}
