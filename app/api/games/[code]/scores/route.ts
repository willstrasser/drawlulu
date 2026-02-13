import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prompts, guesses, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getPrompterScore } from "@/lib/scoring";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roundId } = (await request.json()) as { roundId: string };

  const roundPrompts = await db
    .select()
    .from(prompts)
    .where(eq(prompts.roundId, roundId));

  // Aggregate scores per player
  const scoreMap: Record<string, { username: string; score: number }> = {};

  for (const prompt of roundPrompts) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, prompt.userId));
    if (!user) continue;

    if (!scoreMap[user.clerkId]) {
      scoreMap[user.clerkId] = { username: user.username, score: 0 };
    }

    // Get guesses for this prompt
    const promptGuesses = await db
      .select()
      .from(guesses)
      .where(eq(guesses.promptId, prompt.id));

    const correctGuesses = promptGuesses.filter((g) => g.isCorrect);
    const anyCorrect = correctGuesses.length > 0;

    // Prompter score
    const prompterScore = getPrompterScore(
      anyCorrect,
      (prompt.forbiddenWordsUsed || []).length
    );
    scoreMap[user.clerkId].score += prompterScore;

    // Guesser scores
    for (const guess of promptGuesses) {
      const [guesser] = await db
        .select()
        .from(users)
        .where(eq(users.id, guess.userId));
      if (!guesser) continue;

      if (!scoreMap[guesser.clerkId]) {
        scoreMap[guesser.clerkId] = {
          username: guesser.username,
          score: 0,
        };
      }

      scoreMap[guesser.clerkId].score += guess.pointsAwarded;
    }
  }

  const scores = Object.entries(scoreMap).map(([userId, data]) => ({
    userId,
    username: data.username,
    score: data.score,
  }));

  return NextResponse.json({ scores });
}
