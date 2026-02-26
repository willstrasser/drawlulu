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
  prompterPoints: number;
  correctGuesses: { username: string; points: number }[];
};

export type RoundData = {
  myAssignment: MyAssignment | null;
  prompts: PromptEntry[] | null;
  scores: PlayerScore[] | null;
  promptBreakdowns: PromptBreakdown[] | null;
};
