import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, prompts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateImage } from "@/lib/fal";
import { PHASE } from "@/lib/phases";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [game] = await db.select().from(games).where(eq(games.roomCode, code));

  if (!game || !game.currentRoundId) {
    return NextResponse.json({ error: "No active round" }, { status: 404 });
  }

  const roundPrompts = await db
    .select()
    .from(prompts)
    .where(eq(prompts.roundId, game.currentRoundId));

  const results = await Promise.allSettled(
    roundPrompts.map(async (p) => {
      if (!p.sanitizedPrompt) return null;
      const imageUrl = await generateImage(p.sanitizedPrompt);
      await db.update(prompts).set({ imageUrl }).where(eq(prompts.id, p.id));
      return { promptId: p.id, imageUrl };
    }),
  );

  const generated = results
    .filter(
      (
        r,
      ): r is PromiseFulfilledResult<{
        promptId: string;
        imageUrl: string;
      } | null> => r.status === "fulfilled" && r.value !== null,
    )
    .map((r) => r.value!);

  await db
    .update(games)
    .set({ status: PHASE.GUESSING })
    .where(eq(games.id, game.id));

  return NextResponse.json({ generated });
}
