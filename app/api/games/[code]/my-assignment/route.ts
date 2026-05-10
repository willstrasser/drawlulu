import { db } from "@/lib/db";
import { prompts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { withGameContext } from "@/lib/api/with-game-context";
import { errorResponse, jsonResponse } from "@/lib/api/json";

export const GET = withGameContext(
  { requireRound: true, requirePlayer: true },
  async (_request, { user, round }) => {
    const [prompt] = await db
      .select()
      .from(prompts)
      .where(
        and(eq(prompts.roundId, round!.id), eq(prompts.userId, user.userId)),
      );

    if (!prompt) return errorResponse("No assignment found", 404);

    return jsonResponse({
      promptId: prompt.id,
      targetWord: prompt.targetWord,
      tabooWords: prompt.tabooWords,
    });
  },
);
