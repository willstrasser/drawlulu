import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, prompts, users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getUser } from "@/lib/get-user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const user = await getUser();
  if (!user) {
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

  // Batch-load all users referenced by prompts in a single query
  const userIds = [...new Set(roundPrompts.map((p) => p.userId))];
  const userRows = userIds.length > 0
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];
  const userMap = new Map(userRows.map((u) => [u.id, u]));

  const promptsWithUsers = roundPrompts.map((p) => {
    const u = userMap.get(p.userId);
    return {
      promptId: p.id,
      userId: u?.id ?? "",
      username: u?.username ?? "Unknown",
      targetWord: p.targetWord,
      tabooWords: p.tabooWords,
      imageUrl: p.imageUrl,
      forbiddenWordsUsed: p.forbiddenWordsUsed || [],
      sanitizedPrompt: p.sanitizedPrompt,
    };
  });

  return NextResponse.json({ prompts: promptsWithUsers });
}
