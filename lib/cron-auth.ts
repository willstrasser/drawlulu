import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Verifies the `Authorization: Bearer $CRON_SECRET` header Vercel Cron sends.
 * Returns an error response to send back, or null when authorized.
 */
export function checkCronAuth(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }
  const provided =
    request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const providedBuf = Buffer.from(provided.padEnd(cronSecret.length));
  const secretBuf = Buffer.from(cronSecret.padEnd(provided.length));
  const match =
    provided.length === cronSecret.length &&
    timingSafeEqual(providedBuf, secretBuf);
  if (!match) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
