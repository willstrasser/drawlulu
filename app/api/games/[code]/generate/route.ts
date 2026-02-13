import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, prompts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateImage } from "@/lib/fal";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roundId } = (await request.json()) as { roundId: string };

  // Verify host
  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.roomCode, code));

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const [hostUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));

  if (!hostUser || hostUser.id !== game.hostId) {
    return NextResponse.json({ error: "Only host can generate" }, { status: 403 });
  }

  // Get all prompts for this round
  const roundPrompts = await db
    .select()
    .from(prompts)
    .where(eq(prompts.roundId, roundId));

  // Generate images in parallel
  const results = await Promise.allSettled(
    roundPrompts.map(async (p) => {
      if (!p.sanitizedPrompt) return null;
      const imageUrl = await generateImage(p.sanitizedPrompt);
      await db
        .update(prompts)
        .set({ imageUrl })
        .where(eq(prompts.id, p.id));
      return { promptId: p.id, imageUrl };
    })
  );

  const generated = results
    .filter(
      (r): r is PromiseFulfilledResult<{ promptId: string; imageUrl: string } | null> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value!);

  // Update game status
  await db
    .update(games)
    .set({ status: "guessing" })
    .where(eq(games.id, game.id));

  return NextResponse.json({ generated });
}
