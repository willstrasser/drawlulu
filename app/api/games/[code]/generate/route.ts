import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, rounds, prompts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateImage } from "@/lib/fal";
import { getUser } from "@/lib/get-user";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const user = await getUser();
  if (!user) {
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

  const MOCK_FAL_IMAGE = "https://placehold.co/512x512.png";

  const results = await Promise.allSettled(
    roundPrompts.map(async (p) => {
      if (!p.sanitizedPrompt) return null;
      const imageUrl =
        process.env.MOCK_FAL === "true"
          ? MOCK_FAL_IMAGE
          : await generateImage(p.sanitizedPrompt);
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
    .update(rounds)
    .set({ status: "guessing" })
    .where(eq(rounds.id, game.currentRoundId!));

  return NextResponse.json({ generated });
}
