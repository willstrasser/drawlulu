import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { games, guesses, prompts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getGuesserScore } from "@/lib/scoring";
import { getUser } from "@/lib/get-user";

const GuessSchema = z.object({
  promptId: z.string().uuid(),
  guessText: z.string().min(1).max(200),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = GuessSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { promptId, guessText } = parsed.data;

  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.roomCode, code));

  if (!game || !game.currentRoundId) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Get the prompt to check the target word
  const [prompt] = await db
    .select()
    .from(prompts)
    .where(eq(prompts.id, promptId));

  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  // Ensure this prompt belongs to the current round of this game
  if (prompt.roundId !== game.currentRoundId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Don't let the prompter guess their own
  if (prompt.userId === user.userId) {
    return NextResponse.json(
      { error: "Can't guess your own prompt" },
      { status: 400 }
    );
  }

  // Check if already guessed correctly
  const existingCorrect = await db
    .select()
    .from(guesses)
    .where(
      and(
        eq(guesses.promptId, promptId),
        eq(guesses.userId, user.userId),
        eq(guesses.isCorrect, true)
      )
    );

  if (existingCorrect.length > 0) {
    return NextResponse.json(
      { error: "Already guessed correctly" },
      { status: 400 }
    );
  }

  // Check if guess is correct (case-insensitive, trimmed)
  const isCorrect =
    guessText.trim().toLowerCase() === prompt.targetWord.trim().toLowerCase();

  // Count existing correct guesses to determine rank, then insert — atomic via transaction
  let guess: typeof guesses.$inferSelect;

  if (isCorrect) {
    guess = await db.transaction(async (tx) => {
      // Lock the prompt row — serializes all concurrent correct guesses for this image
      await tx
        .select({ id: prompts.id })
        .from(prompts)
        .where(eq(prompts.id, promptId))
        .for("update");

      const allCorrect = await tx
        .select()
        .from(guesses)
        .where(and(eq(guesses.promptId, promptId), eq(guesses.isCorrect, true)));

      const pts = getGuesserScore(allCorrect.length);

      const [inserted] = await tx
        .insert(guesses)
        .values({
          promptId,
          userId: user.userId,
          guessText: guessText.trim(),
          isCorrect: true,
          pointsAwarded: pts,
        })
        .returning();

      return inserted;
    });
  } else {
    const [inserted] = await db
      .insert(guesses)
      .values({
        promptId,
        userId: user.userId,
        guessText: guessText.trim(),
        isCorrect: false,
        pointsAwarded: 0,
      })
      .returning();
    guess = inserted;
  }

  return NextResponse.json({
    isCorrect: guess.isCorrect,
    pointsAwarded: guess.pointsAwarded,
    username: user.username,
  });
}
