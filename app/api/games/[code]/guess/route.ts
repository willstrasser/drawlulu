import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guesses, prompts, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getGuesserScore } from "@/lib/scoring";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { promptId, guessText } = (await request.json()) as {
    promptId: string;
    guessText: string;
  };

  // Get the prompt to check the target word
  const [prompt] = await db
    .select()
    .from(prompts)
    .where(eq(prompts.id, promptId));

  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  // Don't let the prompter guess their own
  if (prompt.userId === dbUser.id) {
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
        eq(guesses.userId, dbUser.id),
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
          userId: dbUser.id,
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
        userId: dbUser.id,
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
    username: dbUser.username,
  });
}
