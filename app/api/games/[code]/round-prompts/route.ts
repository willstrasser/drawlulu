import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prompts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roundId } = (await request.json()) as { roundId: string };

  const roundPrompts = await db
    .select()
    .from(prompts)
    .where(eq(prompts.roundId, roundId));

  // Join with users to get clerk IDs and usernames
  const promptsWithUsers = await Promise.all(
    roundPrompts.map(async (p) => {
      const [user] = await db.select().from(users).where(eq(users.id, p.userId));
      return {
        promptId: p.id,
        userId: user?.clerkId || "",
        username: user?.username || "Unknown",
        targetWord: p.targetWord,
        tabooWords: p.tabooWords,
        imageUrl: p.imageUrl,
        forbiddenWordsUsed: p.forbiddenWordsUsed || [],
      };
    })
  );

  return NextResponse.json({ prompts: promptsWithUsers });
}
