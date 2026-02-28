import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("oauth_state")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${APP_URL}/?error=oauth_failed`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${APP_URL}/api/auth/callback/google`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${APP_URL}/?error=oauth_failed`);
    }

    const { access_token } = (await tokenRes.json()) as { access_token: string };

    // Fetch user info from Google
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${APP_URL}/?error=oauth_failed`);
    }

    const googleUser = (await userInfoRes.json()) as {
      sub: string;
      name?: string;
      given_name?: string;
      picture?: string;
      email?: string;
    };

    const oauthId = googleUser.sub;
    const username = googleUser.name ?? googleUser.given_name ?? googleUser.email?.split("@")[0] ?? "Player";
    const imageUrl = googleUser.picture;

    // Check if a user already exists for this Google account
    const [existingOAuth] = await db
      .select()
      .from(users)
      .where(eq(users.oauthId, oauthId));

    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    let userId: string;

    if (existingOAuth) {
      // Already linked — just sign in
      userId = existingOAuth.id;
    } else if (session.userId) {
      // Guest is signing in with Google — link their existing account
      await db
        .update(users)
        .set({ oauthProvider: "google", oauthId, imageUrl })
        .where(eq(users.id, session.userId));
      userId = session.userId;
    } else {
      // Brand new OAuth user
      userId = randomUUID();
      await db.insert(users).values({
        id: userId,
        username,
        imageUrl,
        oauthProvider: "google",
        oauthId,
      });
    }

    // Refresh session
    const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
    session.userId = dbUser.id;
    session.username = dbUser.username;
    session.imageUrl = dbUser.imageUrl ?? undefined;
    await session.save();

    const response = NextResponse.redirect(`${APP_URL}/`);
    response.cookies.delete("oauth_state");
    return response;
  } catch {
    return NextResponse.redirect(`${APP_URL}/?error=oauth_failed`);
  }
}
