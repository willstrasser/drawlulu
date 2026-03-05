export type MyAssignment = {
  promptId: string;
  targetWord: string;
  tabooWords: string[];
};

export type PromptEntry = {
  promptId: string;
  userId: string;
  username: string;
  targetWord: string;
  tabooWords: string[];
  imageUrl: string | null;
  forbiddenWordsUsed: string[];
  sanitizedPrompt: string | null;
};

export type PlayerScore = {
  userId: string;
  username: string;
  score: number;
};

export type PromptBreakdown = {
  promptId: string;
  prompter: string;
  targetWord: string;
  imageUrl: string | null;
  forbiddenWordsUsed: string[];
  sanitizedPrompt: string | null;
  prompterPoints: number;
  correctGuesses: { username: string; points: number }[];
};

export type RoundData = {
  myAssignment: MyAssignment | null;
  prompts: PromptEntry[] | null;
  roundScores: PlayerScore[] | null;
  cumulativeScores: PlayerScore[] | null;
  promptBreakdowns: PromptBreakdown[] | null;
};
