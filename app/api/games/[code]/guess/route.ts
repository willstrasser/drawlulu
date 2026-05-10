import { db } from "@/lib/db";
import { guesses, prompts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getGuesserScore } from "@/lib/scoring";
import { withGameContext } from "@/lib/api/with-game-context";
import { errorResponse, jsonResponse } from "@/lib/api/json";
import { parseBody } from "@/lib/api/zod";
import { GuessRequestSchema } from "@/lib/api/types";

export const POST = withGameContext(
  { requireRound: true, requirePlayer: true },
  async (request, { user, round }) => {
    const parsed = await parseBody(request, GuessRequestSchema);
    if (!parsed.ok) return parsed.response;
    const { promptId, guessText } = parsed.data;

    // Pre-flight checks before the transaction (cheap rejects).
    const [prompt] = await db
      .select()
      .from(prompts)
      .where(eq(prompts.id, promptId));

    if (!prompt) return errorResponse("Prompt not found", 404);
    if (prompt.roundId !== round!.id) return errorResponse("Forbidden", 403);
    if (prompt.userId === user.userId)
      return errorResponse("Can't guess your own prompt", 400);

    const existingCorrect = await db
      .select()
      .from(guesses)
      .where(
        and(
          eq(guesses.promptId, promptId),
          eq(guesses.userId, user.userId),
          eq(guesses.isCorrect, true),
        ),
      );

    if (existingCorrect.length > 0)
      return errorResponse("Already guessed correctly", 400);

    const isCorrect =
      guessText.trim().toLowerCase() === prompt.targetWord.trim().toLowerCase();

    let guess: typeof guesses.$inferSelect;

    if (isCorrect) {
      guess = await db.transaction(async (tx) => {
        // Lock the prompt row, then re-read to defend against TOCTOU
        // (e.g. prompt deleted/changed between pre-flight and tx start).
        const [lockedPrompt] = await tx
          .select()
          .from(prompts)
          .where(eq(prompts.id, promptId))
          .for("update");

        if (!lockedPrompt) throw new Error("Prompt vanished during guess");

        const allCorrect = await tx
          .select()
          .from(guesses)
          .where(
            and(eq(guesses.promptId, promptId), eq(guesses.isCorrect, true)),
          );

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

        if (!inserted) throw new Error("Insert returned no row");
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
      if (!inserted) throw new Error("Insert returned no row");
      guess = inserted;
    }

    return jsonResponse({
      isCorrect: guess.isCorrect,
      pointsAwarded: guess.pointsAwarded,
      username: user.username,
    });
  },
);
