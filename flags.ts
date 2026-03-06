import { flag, dedupe } from "flags/next";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";

const identify = dedupe(async () => {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );
  const r = { user: session.userId ? { id: session.userId } : undefined };
  console.log({ r });
  return r;
});

export const devPanelFlag = flag<boolean>({
  key: "has-dev-panel",
  identify,
  decide: () => false,
  defaultValue: false,
  description: "Show the DevPanel for specific users",
});
