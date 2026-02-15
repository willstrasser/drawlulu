export const PHASE = {
  LOBBY: "lobby",
  PROMPTING: "prompting",
  GENERATING: "generating",
  GUESSING: "guessing",
  SCOREBOARD: "scoreboard",
} as const;

export type GamePhase = (typeof PHASE)[keyof typeof PHASE];
