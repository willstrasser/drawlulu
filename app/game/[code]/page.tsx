import { devPanelFlag } from "@/flags";
import GamePage from "./GamePage";

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const showDevPanel = await devPanelFlag();
  console.log(`[GamePage] showDevPanel=${showDevPanel}`); // Debug log to verify flag value
  return <GamePage code={code} showDevPanel={showDevPanel} />;
}
