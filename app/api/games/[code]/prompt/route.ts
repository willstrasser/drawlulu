import { db } from "@/lib/db";
import { prompts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateTabooWords } from "@/lib/utils";
import { withGameContext } from "@/lib/api/with-game-context";
import { errorResponse, jsonResponse } from "@/lib/api/json";
import { parseBody } from "@/lib/api/zod";
import { PromptRequestSchema } from "@/lib/api/types";

export const POST = withGameContext(
  { requireRound: true, requirePlayer: true },
  async (request, { user }) => {
    const parsed = await parseBody(request, PromptRequestSchema);
    if (!parsed.ok) return parsed.response;
    const { promptId, promptText } = parsed.data;

    const [prompt] = await db
      .select()
      .from(prompts)
      .where(eq(prompts.id, promptId));

    if (!prompt) return errorResponse("Prompt not found", 404);
    if (prompt.userId !== user.userId) return errorResponse("Forbidden", 403);

    const { sanitizedPrompt, forbiddenWordsUsed } = validateTabooWords(
      promptText,
      prompt.tabooWords,
    );

    const [updated] = await db
      .update(prompts)
      .set({
        originalPrompt: promptText,
        sanitizedPrompt,
        forbiddenWordsUsed,
      })
      .where(eq(prompts.id, promptId))
      .returning();

    return jsonResponse({
      sanitizedPrompt: updated.sanitizedPrompt,
      forbiddenWordsUsed: updated.forbiddenWordsUsed,
    });
  },
);
