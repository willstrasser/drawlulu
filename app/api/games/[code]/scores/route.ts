import { db } from "@/lib/db";
import { rounds, prompts, guesses, users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import {
  computeRoundScores,
  computeCumulativeScores,
  scoreMapToList,
  type GuessesByPromptId,
  type ScoreGuessRow,
  type UserMap,
} from "@/lib/scoring";
import { withGameContext } from "@/lib/api/with-game-context";
import { jsonResponse } from "@/lib/api/json";

export const GET = withGameContext(
  { requireRound: true, requirePlayer: true },
  async (_request, { game, round }) => {
    const allRounds = await db
      .select()
      .from(rounds)
      .where(eq(rounds.gameId, game.id));
    const allRoundIds = allRounds.map((r) => r.id);

    const roundPrompts = await db
      .select()
      .from(prompts)
      .where(eq(prompts.roundId, round!.id));

    const allPrompts =
      allRoundIds.length > 0
        ? await db.select().from(prompts).where(inArray(prompts.roundId, allRoundIds))
        : [];

    const allPromptIds = allPrompts.map((p) => p.id);
    const allGuesses =
      allPromptIds.length > 0
        ? await db.select().from(guesses).where(inArray(guesses.promptId, allPromptIds))
        : [];

    const guessesByPromptId: GuessesByPromptId = new Map();
    for (const g of allGuesses) {
      const list = guessesByPromptId.get(g.promptId) ?? [];
      list.push(g satisfies ScoreGuessRow);
      guessesByPromptId.set(g.promptId, list);
    }

    const allUserIds = new Set<string>();
    for (const p of allPrompts) allUserIds.add(p.userId);
    for (const g of allGuesses) allUserIds.add(g.userId);
    const userIds = [...allUserIds];
    const userRows =
      userIds.length > 0
        ? await db.select().from(users).where(inArray(users.id, userIds))
        : [];
    const userMap: UserMap = new Map(userRows.map((u) => [u.id, u]));

    const { scoreMap: roundScoreMap, breakdowns: promptBreakdowns } =
      computeRoundScores(roundPrompts, guessesByPromptId, userMap);
    const cumulativeScoreMap = computeCumulativeScores(
      allPrompts,
      guessesByPromptId,
      userMap,
    );

    return jsonResponse({
      roundNumber: round!.roundNumber,
      roundScores: scoreMapToList(roundScoreMap),
      cumulativeScores: scoreMapToList(cumulativeScoreMap),
      promptBreakdowns,
    });
  },
);
