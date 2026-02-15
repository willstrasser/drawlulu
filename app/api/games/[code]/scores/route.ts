import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, prompts, guesses, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPrompterScore } from "@/lib/scoring";

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

  const scoreMap: Record<string, { username: string; score: number }> = {};

  const promptBreakdowns = [];

  for (const prompt of roundPrompts) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, prompt.userId));
    if (!user) continue;

    if (!scoreMap[user.clerkId]) {
      scoreMap[user.clerkId] = { username: user.username, score: 0 };
    }

    const promptGuesses = await db
      .select()
      .from(guesses)
      .where(eq(guesses.promptId, prompt.id));

    const correctGuesses = promptGuesses.filter((g) => g.isCorrect);
    const anyCorrect = correctGuesses.length > 0;

    const forbiddenCount = (prompt.forbiddenWordsUsed || []).length;
    const prompterScore = getPrompterScore(anyCorrect, forbiddenCount);
    scoreMap[user.clerkId].score += prompterScore;

    const guessDetails = [];
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

      if (guess.isCorrect) {
        guessDetails.push({
          username: guesser.username,
          points: guess.pointsAwarded,
        });
      }
    }

    promptBreakdowns.push({
      promptId: prompt.id,
      prompter: user.username,
      targetWord: prompt.targetWord,
      imageUrl: prompt.imageUrl,
      forbiddenWordsUsed: prompt.forbiddenWordsUsed || [],
      prompterPoints: prompterScore,
      correctGuesses: guessDetails,
    });
  }

  const scores = Object.entries(scoreMap).map(([userId, data]) => ({
    userId,
    username: data.username,
    score: data.score,
  }));

  return NextResponse.json({ scores, promptBreakdowns });
}
