import { PHASE } from "@/lib/phases";
import { withGameContext } from "@/lib/api/with-game-context";
import { errorResponse, jsonResponse } from "@/lib/api/json";

export const POST = withGameContext({}, async (_request, { game }) => {
  if (game.status !== PHASE.LOBBY) {
    return errorResponse("Game already in progress", 400);
  }
  return jsonResponse({ roomCode: game.roomCode, gameId: game.id });
});
