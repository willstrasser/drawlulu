import { NextResponse } from "next/server";

// Edge-runtime keeps latency low and stable, which is what matters for
// the RTT-based offset estimate on the client.
export const runtime = "edge";
// Never cache — clients use the timestamp the server stamps at request time.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { t: Date.now() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
