import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PHASE } from "@/lib/phases";
import { ensureUser } from "@/lib/ensure-user";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureUser(clerkId);

  // Check game exists and is in lobby
  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.roomCode, code));

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== PHASE.LOBBY) {
    return NextResponse.json(
      { error: "Game already in progress" },
      { status: 400 }
    );
  }

  return NextResponse.json({ roomCode: game.roomCode, gameId: game.id });
}
