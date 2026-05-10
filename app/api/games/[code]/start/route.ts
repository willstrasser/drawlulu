import { db } from "@/lib/db";
import { games, rounds, prompts, users } from "@/lib/db/schema";
import { eq, max, inArray } from "drizzle-orm";
import { getWordCardsFromDB } from "@/lib/db/word-cards";
import { withGameContext } from "@/lib/api/with-game-context";
import { errorResponse, jsonResponse } from "@/lib/api/json";
import { parseBody } from "@/lib/api/zod";
import { StartRequestSchema } from "@/lib/api/types";

export const POST = withGameContext(
  { requireHost: true },
  async (request, { game }) => {
    const parsed = await parseBody(request, StartRequestSchema);
    if (!parsed.ok) return parsed.response;
    const { playerUserIds, category } = parsed.data;

    const playerUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, playerUserIds));

    if (playerUsers.length < 2)
      return errorResponse("Not enough registered players", 400);

    // Preserve order from the request — single Map lookup beats find() per id.
    const byId = new Map(playerUsers.map((u) => [u.id, u]));
    const orderedPlayers = playerUserIds
      .map((id) => byId.get(id))
      .filter((u): u is typeof playerUsers[number] => Boolean(u));

    const [{ maxRound }] = await db
      .select({ maxRound: max(rounds.roundNumber) })
      .from(rounds)
      .where(eq(rounds.gameId, game.id));

    const nextRoundNumber = (maxRound ?? 0) + 1;

    const cards = await getWordCardsFromDB(orderedPlayers.length, category);

    // Round + prompts must commit atomically. Without this, a failed prompts
    // insert would leave an orphan round visible to the rest of the game.
    const { round, promptEntries } = await db.transaction(async (tx) => {
      const [round] = await tx
        .insert(rounds)
        .values({
          gameId: game.id,
          roundNumber: nextRoundNumber,
          status: "prompting",
        })
        .returning();

      const promptEntries = await tx
        .insert(prompts)
        .values(
          orderedPlayers.map((player, i) => ({
            roundId: round.id,
            userId: player.id,
            targetWord: cards[i].objective,
            tabooWords: cards[i].taboos,
          })),
        )
        .returning();

      await tx
        .update(games)
        .set({ status: "active", currentRoundId: round.id })
        .where(eq(games.id, game.id));

      return { round, promptEntries };
    });

    const assignments: Record<
      string,
      { promptId: string; targetWord: string; tabooWords: string[] }
    > = {};
    for (const p of promptEntries) {
      assignments[p.userId] = {
        promptId: p.id,
        targetWord: p.targetWord,
        tabooWords: p.tabooWords,
      };
    }

    return jsonResponse({
      roundId: round.id,
      roundNumber: nextRoundNumber,
      assignments,
    });
  },
);
