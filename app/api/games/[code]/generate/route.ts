import { db } from "@/lib/db";
import { rounds, prompts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateImage } from "@/lib/fal";
import { withGameContext } from "@/lib/api/with-game-context";
import { jsonResponse } from "@/lib/api/json";
import { log } from "@/lib/logger";

const MOCK_FAL_IMAGE = "https://placehold.co/512x512.png";

export const POST = withGameContext(
  { requireRound: true },
  async (_request, { round }) => {
    const roundPrompts = await db
      .select()
      .from(prompts)
      .where(eq(prompts.roundId, round!.id));

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

    const generated: { promptId: string; imageUrl: string }[] = [];
    for (const [i, r] of results.entries()) {
      if (r.status === "rejected") {
        log.error("generate", "Image generation failed for prompt", r.reason, {
          promptId: roundPrompts[i].id,
        });
      } else if (r.value !== null) {
        generated.push(r.value);
      }
    }

    await db
      .update(rounds)
      .set({ status: "guessing" })
      .where(eq(rounds.id, round!.id));

    return jsonResponse({ generated });
  },
);
