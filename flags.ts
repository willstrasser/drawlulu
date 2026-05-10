import { flag, dedupe } from "flags/next";
import { getSession } from "@/lib/iron-session";

const identify = dedupe(async () => {
  const session = await getSession();
  return { user: session.userId ? { id: session.userId } : undefined };
});

export const devPanelFlag = flag<boolean>({
  key: "show-dev-panel",
  identify,
  decide: () => process.env.NODE_ENV !== "production",
  defaultValue: false,
  description: "Show the DevPanel for specific users",
});
