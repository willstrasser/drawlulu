import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { upsertUser } from "@/lib/ensure-user";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const { username } = (await request.json()) as { username?: string };

  if (!username || !username.trim()) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  const trimmed = username.trim().slice(0, 32);
  const userId = randomUUID();

  await upsertUser(userId, trimmed);

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.userId = userId;
  session.username = trimmed;
  await session.save();

  return NextResponse.json({ userId, username: trimmed });
}
