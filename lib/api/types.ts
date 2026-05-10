import { z } from "zod";

export {
  type MyAssignment,
  type PromptEntry,
  type PlayerScore,
  type PromptBreakdown,
  type RoundData,
} from "@/lib/game-types";

export const StartRequestSchema = z.object({
  playerUserIds: z.array(z.string().uuid()).min(2),
  category: z.string().optional(),
});
export type StartRequest = z.infer<typeof StartRequestSchema>;

export const StartResponseSchema = z.object({
  roundId: z.string().uuid(),
  roundNumber: z.number().int().positive(),
  assignments: z.record(
    z.string(),
    z.object({
      promptId: z.string().uuid(),
      targetWord: z.string(),
      tabooWords: z.array(z.string()),
    }),
  ),
});
export type StartResponse = z.infer<typeof StartResponseSchema>;

export const PromptRequestSchema = z.object({
  promptId: z.string().uuid(),
  promptText: z.string().min(1).max(1000),
});
export type PromptRequest = z.infer<typeof PromptRequestSchema>;

export const PromptResponseSchema = z.object({
  sanitizedPrompt: z.string().nullable(),
  forbiddenWordsUsed: z.array(z.string()).nullable(),
});
export type PromptResponse = z.infer<typeof PromptResponseSchema>;

export const GuessRequestSchema = z.object({
  promptId: z.string().uuid(),
  guessText: z.string().min(1).max(200),
});
export type GuessRequest = z.infer<typeof GuessRequestSchema>;

export const GuessResponseSchema = z.object({
  isCorrect: z.boolean(),
  pointsAwarded: z.number().int(),
  username: z.string(),
});
export type GuessResponse = z.infer<typeof GuessResponseSchema>;

export const MyAssignmentResponseSchema = z.object({
  promptId: z.string().uuid(),
  targetWord: z.string(),
  tabooWords: z.array(z.string()),
});
export type MyAssignmentResponse = z.infer<typeof MyAssignmentResponseSchema>;

export const PromptEntrySchema = z.object({
  promptId: z.string().uuid(),
  userId: z.string(),
  username: z.string(),
  targetWord: z.string(),
  tabooWords: z.array(z.string()),
  imageUrl: z.string().nullable(),
  forbiddenWordsUsed: z.array(z.string()),
  sanitizedPrompt: z.string().nullable(),
});

export const RoundPromptsResponseSchema = z.object({
  prompts: z.array(PromptEntrySchema),
});
export type RoundPromptsResponse = z.infer<typeof RoundPromptsResponseSchema>;

export const PlayerScoreSchema = z.object({
  userId: z.string(),
  username: z.string(),
  score: z.number(),
});

export const PromptBreakdownSchema = z.object({
  promptId: z.string().uuid(),
  prompter: z.string(),
  targetWord: z.string(),
  imageUrl: z.string().nullable(),
  forbiddenWordsUsed: z.array(z.string()),
  sanitizedPrompt: z.string().nullable(),
  prompterPoints: z.number(),
  correctGuesses: z.array(
    z.object({ username: z.string(), points: z.number() }),
  ),
});

export const ScoresResponseSchema = z.object({
  roundNumber: z.number().int().positive(),
  roundScores: z.array(PlayerScoreSchema),
  cumulativeScores: z.array(PlayerScoreSchema),
  promptBreakdowns: z.array(PromptBreakdownSchema),
});
export type ScoresResponse = z.infer<typeof ScoresResponseSchema>;

export const GameInfoResponseSchema = z.object({
  hostUserId: z.string().uuid(),
});
export type GameInfoResponse = z.infer<typeof GameInfoResponseSchema>;

export const CategoriesResponseSchema = z.object({
  categories: z.array(z.string()),
});
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;
