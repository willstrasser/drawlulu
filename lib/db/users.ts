import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export type UserRow = typeof users.$inferSelect;

export async function findUserByOAuth(
  provider: string,
  oauthId: string,
): Promise<UserRow | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.oauthProvider, provider), eq(users.oauthId, oauthId)));
  return user ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

export async function linkOAuthToUser(
  userId: string,
  params: { provider: string; oauthId: string; imageUrl?: string },
): Promise<void> {
  await db
    .update(users)
    .set({
      oauthProvider: params.provider,
      oauthId: params.oauthId,
      imageUrl: params.imageUrl,
    })
    .where(eq(users.id, userId));
}

export async function createOAuthUser(params: {
  provider: string;
  oauthId: string;
  username: string;
  imageUrl?: string;
}): Promise<string> {
  const id = randomUUID();
  await db.insert(users).values({
    id,
    username: params.username,
    imageUrl: params.imageUrl,
    oauthProvider: params.provider,
    oauthId: params.oauthId,
  });
  return id;
}
