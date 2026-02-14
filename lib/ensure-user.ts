import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function ensureUser(clerkId: string) {
  let [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId));

  if (!dbUser) {
    // Fetch user info from Clerk by ID
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const username = clerkUser.username || clerkUser.firstName || "Player";
    const imageUrl = clerkUser.imageUrl;

    [dbUser] = await db
      .insert(users)
      .values({ clerkId, username, imageUrl })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: { username, imageUrl },
      })
      .returning();
  }

  return dbUser;
}
