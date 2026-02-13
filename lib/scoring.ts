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
