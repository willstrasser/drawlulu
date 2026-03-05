export const PHASE = {
  LOBBY: "lobby",
  PROMPTING: "prompting",
  GENERATING: "generating",
  GUESSING: "guessing",
  REVEALING: "revealing",
  SCOREBOARD: "scoreboard",
} as const;

export type GamePhase = (typeof PHASE)[keyof typeof PHASE];
