import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "./session";

/**
 * Read the iron-session cookie and return the session user, or null if
 * the request has no valid session.
 */
export async function getUser(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.userId) return null;
  return {
    userId: session.userId,
    username: session.username,
    imageUrl: session.imageUrl,
  };
}
