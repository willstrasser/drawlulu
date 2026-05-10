import type { PromptBreakdown } from "./game-types";

const PROMPTER_BASE_POINTS = 50;
const TABOO_PENALTY = 25;
const GUESSER_POINTS = [100, 75, 50, 30, 20, 10];

export function getPrompterScore(
  anyoneGuessedCorrectly: boolean,
  forbiddenWordsUsed: number
): number {
  if (!anyoneGuessedCorrectly) return 0;
  return Math.max(0, PROMPTER_BASE_POINTS - forbiddenWordsUsed * TABOO_PENALTY);
}

export function getGuesserScore(correctGuessRank: number): number {
  if (correctGuessRank < 0) return 0;
  return GUESSER_POINTS[Math.min(correctGuessRank, GUESSER_POINTS.length - 1)];
}

export type ScorePromptRow = {
  id: string;
  userId: string;
  targetWord: string;
  imageUrl: string | null;
  forbiddenWordsUsed: string[] | null;
  sanitizedPrompt: string | null;
};

export type ScoreGuessRow = {
  promptId: string;
  userId: string;
  isCorrect: boolean;
  pointsAwarded: number;
};

export type ScoreUserRow = {
  id: string;
  username: string;
};

export type ScoreMap = Record<string, { username: string; score: number }>;

export type GuessesByPromptId = Map<string, ScoreGuessRow[]>;
export type UserMap = Map<string, ScoreUserRow>;

function ensureBucket(
  map: ScoreMap,
  user: ScoreUserRow,
): { username: string; score: number } {
  const existing = map[user.id];
  if (existing) return existing;
  const fresh = { username: user.username, score: 0 };
  map[user.id] = fresh;
  return fresh;
}

export function computeRoundScores(
  roundPrompts: ScorePromptRow[],
  guessesByPromptId: GuessesByPromptId,
  userMap: UserMap,
): { scoreMap: ScoreMap; breakdowns: PromptBreakdown[] } {
  const scoreMap: ScoreMap = {};
  const breakdowns: PromptBreakdown[] = [];

  for (const prompt of roundPrompts) {
    const prompter = userMap.get(prompt.userId);
    if (!prompter) continue;

    const promptGuesses = guessesByPromptId.get(prompt.id) ?? [];
    const anyCorrect = promptGuesses.some((g) => g.isCorrect);
    const forbiddenCount = (prompt.forbiddenWordsUsed ?? []).length;
    const prompterScore = getPrompterScore(anyCorrect, forbiddenCount);

    ensureBucket(scoreMap, prompter).score += prompterScore;

    const correctGuessDetails: { username: string; points: number }[] = [];
    for (const guess of promptGuesses) {
      const guesser = userMap.get(guess.userId);
      if (!guesser) continue;
      ensureBucket(scoreMap, guesser).score += guess.pointsAwarded;
      if (guess.isCorrect) {
        correctGuessDetails.push({
          username: guesser.username,
          points: guess.pointsAwarded,
        });
      }
    }

    breakdowns.push({
      promptId: prompt.id,
      prompter: prompter.username,
      targetWord: prompt.targetWord,
      imageUrl: prompt.imageUrl,
      forbiddenWordsUsed: prompt.forbiddenWordsUsed ?? [],
      sanitizedPrompt: prompt.sanitizedPrompt,
      prompterPoints: prompterScore,
      correctGuesses: correctGuessDetails,
    });
  }

  return { scoreMap, breakdowns };
}

export function computeCumulativeScores(
  allPrompts: ScorePromptRow[],
  guessesByPromptId: GuessesByPromptId,
  userMap: UserMap,
): ScoreMap {
  const scoreMap: ScoreMap = {};

  for (const prompt of allPrompts) {
    const prompter = userMap.get(prompt.userId);
    if (!prompter) continue;

    const promptGuesses = guessesByPromptId.get(prompt.id) ?? [];
    const anyCorrect = promptGuesses.some((g) => g.isCorrect);
    const forbiddenCount = (prompt.forbiddenWordsUsed ?? []).length;
    const prompterScore = getPrompterScore(anyCorrect, forbiddenCount);

    ensureBucket(scoreMap, prompter).score += prompterScore;

    for (const guess of promptGuesses) {
      const guesser = userMap.get(guess.userId);
      if (!guesser) continue;
      ensureBucket(scoreMap, guesser).score += guess.pointsAwarded;
    }
  }

  return scoreMap;
}

export function scoreMapToList(
  map: ScoreMap,
): { userId: string; username: string; score: number }[] {
  return Object.entries(map).map(([userId, data]) => ({
    userId,
    username: data.username,
    score: data.score,
  }));
}
