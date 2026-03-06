import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, rounds, prompts, guesses, users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getPrompterScore } from "@/lib/scoring";
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

  // Get all rounds for this game (for cumulative scores)
  const allRounds = await db.select().from(rounds).where(eq(rounds.gameId, game.id));
  const allRoundIds = allRounds.map((r) => r.id);

  const roundPrompts = await db
    .select()
    .from(prompts)
    .where(eq(prompts.roundId, game.currentRoundId));

  if (!roundPrompts.some((p) => p.userId === user.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // All prompts across all rounds (for cumulative)
  const allPrompts = allRoundIds.length > 0
    ? await db.select().from(prompts).where(inArray(prompts.roundId, allRoundIds))
    : [];

  // Batch-load all guesses for all prompts in a single query
  const allPromptIds = allPrompts.map((p) => p.id);
  const allGuesses = allPromptIds.length > 0
    ? await db.select().from(guesses).where(inArray(guesses.promptId, allPromptIds))
    : [];
  const guessesByPromptId = new Map<string, (typeof allGuesses)>();
  for (const g of allGuesses) {
    const list = guessesByPromptId.get(g.promptId) ?? [];
    list.push(g);
    guessesByPromptId.set(g.promptId, list);
  }

  // Batch-load all users (prompters + guessers) in a single query
  const allUserIds = new Set<string>();
  for (const p of allPrompts) allUserIds.add(p.userId);
  for (const g of allGuesses) allUserIds.add(g.userId);
  const userIds = [...allUserIds];
  const userRows = userIds.length > 0
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];
  const userMap = new Map(userRows.map((u) => [u.id, u]));

  // Compute per-round scores and breakdowns using only current-round prompts
  const roundScoreMap: Record<string, { username: string; score: number }> = {};
  const promptBreakdowns = [];

  for (const prompt of roundPrompts) {
    const u = userMap.get(prompt.userId);
    if (!u) continue;

    if (!roundScoreMap[u.id]) {
      roundScoreMap[u.id] = { username: u.username, score: 0 };
    }

    const promptGuesses = guessesByPromptId.get(prompt.id) ?? [];
    const correctGuesses = promptGuesses.filter((g) => g.isCorrect);
    const anyCorrect = correctGuesses.length > 0;
    const forbiddenCount = (prompt.forbiddenWordsUsed || []).length;
    const prompterScore = getPrompterScore(anyCorrect, forbiddenCount);
    roundScoreMap[u.id].score += prompterScore;

    const guessDetails = [];
    for (const guess of promptGuesses) {
      const guesser = userMap.get(guess.userId);
      if (!guesser) continue;

      if (!roundScoreMap[guesser.id]) {
        roundScoreMap[guesser.id] = { username: guesser.username, score: 0 };
      }

      roundScoreMap[guesser.id].score += guess.pointsAwarded;

      if (guess.isCorrect) {
        guessDetails.push({ username: guesser.username, points: guess.pointsAwarded });
      }
    }

    promptBreakdowns.push({
      promptId: prompt.id,
      prompter: u.username,
      targetWord: prompt.targetWord,
      imageUrl: prompt.imageUrl,
      forbiddenWordsUsed: prompt.forbiddenWordsUsed || [],
      sanitizedPrompt: prompt.sanitizedPrompt,
      prompterPoints: prompterScore,
      correctGuesses: guessDetails,
    });
  }

  // Compute cumulative scores across all rounds
  const cumulativeScoreMap: Record<string, { username: string; score: number }> = {};

  for (const prompt of allPrompts) {
    const u = userMap.get(prompt.userId);
    if (!u) continue;

    if (!cumulativeScoreMap[u.id]) {
      cumulativeScoreMap[u.id] = { username: u.username, score: 0 };
    }

    const promptGuesses = guessesByPromptId.get(prompt.id) ?? [];
    const correctGuesses = promptGuesses.filter((g) => g.isCorrect);
    const anyCorrect = correctGuesses.length > 0;
    const forbiddenCount = (prompt.forbiddenWordsUsed || []).length;
    const prompterScore = getPrompterScore(anyCorrect, forbiddenCount);
    cumulativeScoreMap[u.id].score += prompterScore;

    for (const guess of promptGuesses) {
      const guesser = userMap.get(guess.userId);
      if (!guesser) continue;

      if (!cumulativeScoreMap[guesser.id]) {
        cumulativeScoreMap[guesser.id] = { username: guesser.username, score: 0 };
      }

      cumulativeScoreMap[guesser.id].score += guess.pointsAwarded;
    }
  }

  const roundScores = Object.entries(roundScoreMap).map(([userId, data]) => ({
    userId,
    username: data.username,
    score: data.score,
  }));

  const cumulativeScores = Object.entries(cumulativeScoreMap).map(([userId, data]) => ({
    userId,
    username: data.username,
    score: data.score,
  }));

  const currentRound = allRounds.find((r) => r.id === game.currentRoundId);

  return NextResponse.json({
    roundNumber: currentRound?.roundNumber ?? 1,
    roundScores,
    cumulativeScores,
    promptBreakdowns,
  });
}
