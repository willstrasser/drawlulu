import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Upsert a user row by UUID. Called at session creation time only.
 */
export async function upsertUser(
  id: string,
  username: string,
  imageUrl?: string,
) {
  const [user] = await db
    .insert(users)
    .values({ id, username, imageUrl })
    .onConflictDoUpdate({
      target: users.id,
      set: { username, imageUrl },
    })
    .returning();
  return user;
}

/**
 * Find an existing user by their UUID.
 */
export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}
