import { devPanelFlag } from "@/flags";
import { log } from "@/lib/logger";
import GamePage from "./GamePage";

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const showDevPanel = await devPanelFlag();
  log.info("game/page", `showDevPanel=${showDevPanel}`);
  return <GamePage code={code} showDevPanel={showDevPanel} />;
}
