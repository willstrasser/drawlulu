import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, rounds, prompts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getRandomWords } from "@/lib/words";

export async function POST(
  request: Request,
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

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Verify caller is host
  const [hostUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));

  if (!hostUser || hostUser.id !== game.hostId) {
    return NextResponse.json({ error: "Only host can start" }, { status: 403 });
  }

  // Get player clerk IDs from request (sent from Liveblocks presence)
  const { playerClerkIds } = (await request.json()) as {
    playerClerkIds: string[];
  };

  if (playerClerkIds.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 players" },
      { status: 400 }
    );
  }

  // Get DB users for all players
  const playerUsers = await Promise.all(
    playerClerkIds.map(async (cid) => {
      const [u] = await db.select().from(users).where(eq(users.clerkId, cid));
      return u;
    })
  );

  const validPlayers = playerUsers.filter(Boolean);

  // Create round
  const [round] = await db
    .insert(rounds)
    .values({
      gameId: game.id,
      roundNumber: 1,
    })
    .returning();

  // Assign random words to each player
  const words = getRandomWords(validPlayers.length);

  const promptEntries = await Promise.all(
    validPlayers.map(async (player, i) => {
      const [p] = await db
        .insert(prompts)
        .values({
          roundId: round.id,
          userId: player.id,
          targetWord: words[i].target,
          tabooWords: words[i].taboo,
        })
        .returning();
      return p;
    })
  );

  // Update game status
  await db
    .update(games)
    .set({ status: "prompting", currentRoundId: round.id })
    .where(eq(games.id, game.id));

  // Return prompt assignments keyed by clerkId
  const assignments: Record<
    string,
    { promptId: string; targetWord: string; tabooWords: string[] }
  > = {};

  for (let i = 0; i < validPlayers.length; i++) {
    assignments[playerClerkIds[i]] = {
      promptId: promptEntries[i].id,
      targetWord: promptEntries[i].targetWord,
      tabooWords: promptEntries[i].tabooWords,
    };
  }

  return NextResponse.json({
    roundId: round.id,
    assignments,
  });
}
