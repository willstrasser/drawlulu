import { db } from "@/lib/db";
import { prompts, users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { withGameContext } from "@/lib/api/with-game-context";
import { jsonResponse } from "@/lib/api/json";

export const GET = withGameContext(
  { requireRound: true, requirePlayer: true },
  async (_request, { round }) => {
    const roundPrompts = await db
      .select()
      .from(prompts)
      .where(eq(prompts.roundId, round!.id));

    const userIds = [...new Set(roundPrompts.map((p) => p.userId))];
    const userRows =
      userIds.length > 0
        ? await db.select().from(users).where(inArray(users.id, userIds))
        : [];
    const userMap = new Map(userRows.map((u) => [u.id, u]));

    const promptsWithUsers = roundPrompts.map((p) => {
      const u = userMap.get(p.userId);
      return {
        promptId: p.id,
        userId: u?.id ?? "",
        username: u?.username ?? "Unknown",
        targetWord: p.targetWord,
        tabooWords: p.tabooWords,
        imageUrl: p.imageUrl,
        forbiddenWordsUsed: p.forbiddenWordsUsed || [],
        sanitizedPrompt: p.sanitizedPrompt,
      };
    });

    return jsonResponse({ prompts: promptsWithUsers });
  },
);
