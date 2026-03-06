import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { checkRateLimit } from "@/lib/rate-limit";

const ROOM_PATTERN = /^game-[A-Z0-9]{6}$/i;

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(`liveblocks-auth:${user.userId}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const payload = await request.json();
  const room = typeof payload?.room === "string" ? payload.room : null;

  if (!room || !ROOM_PATTERN.test(room)) {
    return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  }

  const session = liveblocks.prepareSession(user.userId, {
    userInfo: {
      username: user.username,
      imageUrl: user.imageUrl,
    },
  });

  session.allow(room, session.FULL_ACCESS);

  const { body, status } = await session.authorize();
  return new Response(body, { status });
}
