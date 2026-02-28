import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prompts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateTabooWords } from "@/lib/utils";
import { getUser } from "@/lib/get-user";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  await params;
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { promptId, promptText } = (await request.json()) as {
    promptId: string;
    promptText: string;
  };

  // Get the prompt entry
  const [prompt] = await db
    .select()
    .from(prompts)
    .where(eq(prompts.id, promptId));

  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  // Validate taboo words
  const { sanitizedPrompt, forbiddenWordsUsed } = validateTabooWords(
    promptText,
    prompt.tabooWords
  );

  // Update prompt in DB
  const [updated] = await db
    .update(prompts)
    .set({
      originalPrompt: promptText,
      sanitizedPrompt,
      forbiddenWordsUsed,
    })
    .where(eq(prompts.id, promptId))
    .returning();

  return NextResponse.json({
    sanitizedPrompt: updated.sanitizedPrompt,
    forbiddenWordsUsed: updated.forbiddenWordsUsed,
  });
}
