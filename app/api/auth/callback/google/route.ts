import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import {
  findUserByOAuth,
  findUserById,
  linkOAuthToUser,
  createOAuthUser,
} from "@/lib/db/users";
import { log } from "@/lib/logger";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function failureRedirect(reason: string) {
  log.error("oauth/google", "callback failed", undefined, { reason });
  return NextResponse.redirect(
    `${APP_URL}/?error=oauth_failed&reason=${encodeURIComponent(reason)}`,
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("oauth_state")?.value;

  if (!code || !state || state !== storedState) {
    return failureRedirect("invalid_state");
  }

  try {
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

    if (!tokenRes.ok) return failureRedirect("token_exchange");

    const { access_token } = (await tokenRes.json()) as { access_token: string };

    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    if (!userInfoRes.ok) return failureRedirect("userinfo_fetch");

    const googleUser = (await userInfoRes.json()) as {
      sub: string;
      name?: string;
      given_name?: string;
      picture?: string;
      email?: string;
    };

    const oauthId = googleUser.sub;
    const username =
      googleUser.name ??
      googleUser.given_name ??
      googleUser.email?.split("@")[0] ??
      "Player";
    const imageUrl = googleUser.picture;

    const existingOAuth = await findUserByOAuth("google", oauthId);

    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    let userId: string;
    if (existingOAuth) {
      userId = existingOAuth.id;
    } else if (session.userId) {
      await linkOAuthToUser(session.userId, {
        provider: "google",
        oauthId,
        imageUrl,
      });
      userId = session.userId;
    } else {
      userId = await createOAuthUser({
        provider: "google",
        oauthId,
        username,
        imageUrl,
      });
    }

    const dbUser = await findUserById(userId);
    if (!dbUser) return failureRedirect("user_not_found");

    session.userId = dbUser.id;
    session.username = dbUser.username;
    session.imageUrl = dbUser.imageUrl ?? undefined;
    await session.save();

    const response = NextResponse.redirect(`${APP_URL}/`);
    response.cookies.delete("oauth_state");
    return response;
  } catch (err) {
    log.error("oauth/google", "callback threw", err);
    return failureRedirect("exception");
  }
}
