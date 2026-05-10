import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { checkRateLimit } from "@/lib/rate-limit";
import { createLobbyGame } from "@/lib/db/games";

export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(`create-game:${user.userId}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const game = await createLobbyGame(user.userId);
  if (!game) {
    return NextResponse.json(
      { error: "Failed to generate room code" },
      { status: 500 },
    );
  }

  return NextResponse.json({ roomCode: game.roomCode });
}
