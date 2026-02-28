import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, prompts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
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

  const [prompt] = await db
    .select()
    .from(prompts)
    .where(
      and(
        eq(prompts.roundId, game.currentRoundId),
        eq(prompts.userId, user.userId)
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
