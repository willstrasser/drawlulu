import { withGameContext } from "@/lib/api/with-game-context";
import { jsonResponse } from "@/lib/api/json";

export const GET = withGameContext({}, async (_request, { game }) => {
  return jsonResponse({ hostUserId: game.hostId });
});
