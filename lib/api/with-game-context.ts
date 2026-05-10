import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { games, rounds, prompts } from "@/lib/db/schema";
import { getUser } from "@/lib/get-user";
import type { SessionData } from "@/lib/session";
import { errorResponse } from "./json";

export type GamePolicy = {
  requireRound?: boolean;
  requireHost?: boolean;
  requirePlayer?: boolean;
};

export type GameContext = {
  user: SessionData;
  game: typeof games.$inferSelect;
  round: typeof rounds.$inferSelect | null;
  isHost: boolean;
  isPlayer: boolean;
  code: string;
};

export type GameRouteHandler = (
  request: Request,
  ctx: GameContext,
) => Promise<NextResponse>;

export function withGameContext(policy: GamePolicy, handler: GameRouteHandler) {
  return async (
    request: Request,
    { params }: { params: Promise<{ code: string }> },
  ): Promise<NextResponse> => {
    const { code } = await params;

    const user = await getUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const [game] = await db.select().from(games).where(eq(games.roomCode, code));
    if (!game) return errorResponse("Game not found", 404);

    const isHost = user.userId === game.hostId;

    let round: typeof rounds.$inferSelect | null = null;
    if (policy.requireRound) {
      if (!game.currentRoundId) return errorResponse("No active round", 404);
      const [r] = await db
        .select()
        .from(rounds)
        .where(eq(rounds.id, game.currentRoundId));
      if (!r) return errorResponse("No active round", 404);
      round = r;
    }

    if (policy.requireHost && !isHost) return errorResponse("Forbidden", 403);

    let isPlayer = false;
    if (policy.requirePlayer) {
      if (!round) return errorResponse("No active round", 404);
      const playerRows = await db
        .select({ userId: prompts.userId })
        .from(prompts)
        .where(
          and(
            eq(prompts.roundId, round.id),
            eq(prompts.userId, user.userId),
          ),
        )
        .limit(1);
      isPlayer = playerRows.length > 0;
      if (!isPlayer) return errorResponse("Forbidden", 403);
    }

    return handler(request, { code, user, game, round, isHost, isPlayer });
  };
}
