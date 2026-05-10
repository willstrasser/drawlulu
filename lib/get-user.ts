import type { SessionData } from "./session";
import { getSession } from "./iron-session";

/**
 * Read the iron-session cookie and return the session user, or null if
 * the request has no valid session.
 */
export async function getUser(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.userId) return null;
  return {
    userId: session.userId,
    username: session.username,
    ...(session.imageUrl !== undefined && { imageUrl: session.imageUrl }),
  };
}
