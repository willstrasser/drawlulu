import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "./session";

/**
 * Returns an iron-session bound to Next's request cookie store.
 *
 * Iron-session 8's `CookieStore` declares `set(name, value, cookie?)` with a
 * stricter optional-parameter shape than Next 16's `ReadonlyRequestCookies`
 * surfaces under `exactOptionalPropertyTypes`. Runtime is fully compatible —
 * the cast confines that drift to one place.
 */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore as never, sessionOptions);
}
