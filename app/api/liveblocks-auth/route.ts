import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { room } = await request.json();

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
