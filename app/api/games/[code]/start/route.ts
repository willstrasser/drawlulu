import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { games, rounds, prompts, users } from "@/lib/db/schema";
import { eq, max, inArray } from "drizzle-orm";
import { getWordCardsFromDB } from "@/lib/db/word-cards";
import { getUser } from "@/lib/get-user";

const StartSchema = z.object({
  playerUserIds: z.array(z.string().uuid()).min(2),
  category: z.string().optional(),
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

  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.roomCode, code));

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Verify caller is host
  if (user.userId !== game.hostId) {
    return NextResponse.json({ error: "Only host can start" }, { status: 403 });
  }

  // Player user IDs are Liveblocks IDs, which are our user UUIDs
  const parsed = StartSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { playerUserIds, category } = parsed.data;

  // Load all players from DB
  const playerUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, playerUserIds));

  if (playerUsers.length < 2) {
    return NextResponse.json(
      { error: "Not enough registered players" },
      { status: 400 }
    );
  }

  // Preserve order matching playerUserIds
  const orderedPlayers = playerUserIds
    .map((id) => playerUsers.find((u) => u.id === id))
    .filter(Boolean) as (typeof playerUsers)[number][];

  // Query max roundNumber for this game and increment
  const [{ maxRound }] = await db
    .select({ maxRound: max(rounds.roundNumber) })
    .from(rounds)
    .where(eq(rounds.gameId, game.id));

  const nextRoundNumber = (maxRound ?? 0) + 1;

  // Create round
  const [round] = await db
    .insert(rounds)
    .values({
      gameId: game.id,
      roundNumber: nextRoundNumber,
      status: "prompting",
    })
    .returning();

  // Assign random cards to each player
  const cards = await getWordCardsFromDB(orderedPlayers.length, category);

  const promptEntries = await db
    .insert(prompts)
    .values(
      orderedPlayers.map((player, i) => ({
        roundId: round.id,
        userId: player.id,
        targetWord: cards[i].objective,
        tabooWords: cards[i].taboos,
      }))
    )
    .returning();

  // Update game to active
  await db
    .update(games)
    .set({ status: "active", currentRoundId: round.id })
    .where(eq(games.id, game.id));

  // Return prompt assignments keyed by userId (UUID)
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

  return NextResponse.json({
    roundId: round.id,
    roundNumber: nextRoundNumber,
    assignments,
  });
}
