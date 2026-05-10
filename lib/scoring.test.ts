import { describe, expect, it } from "vitest";
import {
  getPrompterScore,
  getGuesserScore,
  computeRoundScores,
  computeCumulativeScores,
  scoreMapToList,
  type ScorePromptRow,
  type ScoreGuessRow,
  type ScoreUserRow,
  type GuessesByPromptId,
  type UserMap,
} from "./scoring";

describe("getPrompterScore", () => {
  it("returns 0 when no one guessed correctly, regardless of taboo count", () => {
    expect(getPrompterScore(false, 0)).toBe(0);
    expect(getPrompterScore(false, 1)).toBe(0);
    expect(getPrompterScore(false, 5)).toBe(0);
  });

  it("returns the full 50 base points when correct and no taboos used", () => {
    expect(getPrompterScore(true, 0)).toBe(50);
  });

  it("subtracts 25 per taboo word used", () => {
    expect(getPrompterScore(true, 1)).toBe(25);
    expect(getPrompterScore(true, 2)).toBe(0);
  });

  it("floors at 0 when taboo penalty would go negative", () => {
    expect(getPrompterScore(true, 3)).toBe(0);
    expect(getPrompterScore(true, 99)).toBe(0);
  });
});

describe("getGuesserScore", () => {
  it("returns 0 for a negative rank (no correct guess)", () => {
    expect(getGuesserScore(-1)).toBe(0);
    expect(getGuesserScore(-100)).toBe(0);
  });

  it("returns descending points for the first six ranks", () => {
    expect(getGuesserScore(0)).toBe(100);
    expect(getGuesserScore(1)).toBe(75);
    expect(getGuesserScore(2)).toBe(50);
    expect(getGuesserScore(3)).toBe(30);
    expect(getGuesserScore(4)).toBe(20);
    expect(getGuesserScore(5)).toBe(10);
  });

  it("clamps to the last bucket (10) for ranks beyond the table", () => {
    expect(getGuesserScore(6)).toBe(10);
    expect(getGuesserScore(50)).toBe(10);
  });
});

function makeUser(id: string, username: string): ScoreUserRow {
  return { id, username };
}

function makePrompt(
  id: string,
  userId: string,
  overrides: Partial<ScorePromptRow> = {},
): ScorePromptRow {
  return {
    id,
    userId,
    targetWord: `target-${id}`,
    imageUrl: null,
    forbiddenWordsUsed: [],
    sanitizedPrompt: null,
    ...overrides,
  };
}

function buildGuessIndex(
  guesses: ScoreGuessRow[],
): GuessesByPromptId {
  const map: GuessesByPromptId = new Map();
  for (const g of guesses) {
    const list = map.get(g.promptId) ?? [];
    list.push(g);
    map.set(g.promptId, list);
  }
  return map;
}

describe("computeRoundScores", () => {
  it("scores a 2-player happy path: each player prompter & guesses the other", () => {
    const alice = makeUser("a", "Alice");
    const bob = makeUser("b", "Bob");
    const userMap: UserMap = new Map([
      ["a", alice],
      ["b", bob],
    ]);
    const prompts: ScorePromptRow[] = [
      makePrompt("p1", "a"),
      makePrompt("p2", "b"),
    ];
    const guesses: ScoreGuessRow[] = [
      { promptId: "p1", userId: "b", isCorrect: true, pointsAwarded: 100 },
      { promptId: "p2", userId: "a", isCorrect: true, pointsAwarded: 100 },
    ];

    const { scoreMap, breakdowns } = computeRoundScores(
      prompts,
      buildGuessIndex(guesses),
      userMap,
    );

    expect(scoreMap["a"].score).toBe(50 + 100);
    expect(scoreMap["b"].score).toBe(50 + 100);
    expect(breakdowns).toHaveLength(2);
    expect(breakdowns[0].correctGuesses).toEqual([
      { username: "Bob", points: 100 },
    ]);
    expect(breakdowns[0].prompterPoints).toBe(50);
  });

  it("zeros prompter score when no one guessed correctly", () => {
    const alice = makeUser("a", "Alice");
    const bob = makeUser("b", "Bob");
    const userMap: UserMap = new Map([["a", alice], ["b", bob]]);
    const prompts: ScorePromptRow[] = [makePrompt("p1", "a")];
    const guesses: ScoreGuessRow[] = [
      { promptId: "p1", userId: "b", isCorrect: false, pointsAwarded: 0 },
    ];

    const { scoreMap, breakdowns } = computeRoundScores(
      prompts,
      buildGuessIndex(guesses),
      userMap,
    );

    expect(scoreMap["a"].score).toBe(0);
    expect(scoreMap["b"].score).toBe(0);
    expect(breakdowns[0].prompterPoints).toBe(0);
    expect(breakdowns[0].correctGuesses).toEqual([]);
  });

  it("applies the taboo penalty per forbidden word used", () => {
    const alice = makeUser("a", "Alice");
    const bob = makeUser("b", "Bob");
    const userMap: UserMap = new Map([["a", alice], ["b", bob]]);
    const prompts: ScorePromptRow[] = [
      makePrompt("p1", "a", { forbiddenWordsUsed: ["dragon"] }),
    ];
    const guesses: ScoreGuessRow[] = [
      { promptId: "p1", userId: "b", isCorrect: true, pointsAwarded: 100 },
    ];

    const { scoreMap } = computeRoundScores(
      prompts,
      buildGuessIndex(guesses),
      userMap,
    );

    expect(scoreMap["a"].score).toBe(25);
    expect(scoreMap["b"].score).toBe(100);
  });

  it("skips prompts whose user is not in the userMap", () => {
    const alice = makeUser("a", "Alice");
    const userMap: UserMap = new Map([["a", alice]]);
    const prompts: ScorePromptRow[] = [makePrompt("p1", "ghost")];

    const { scoreMap, breakdowns } = computeRoundScores(
      prompts,
      new Map(),
      userMap,
    );

    expect(Object.keys(scoreMap)).toEqual([]);
    expect(breakdowns).toEqual([]);
  });
});

describe("computeCumulativeScores", () => {
  it("sums prompter+guesser points across all rounds", () => {
    const alice = makeUser("a", "Alice");
    const bob = makeUser("b", "Bob");
    const userMap: UserMap = new Map([["a", alice], ["b", bob]]);
    const allPrompts: ScorePromptRow[] = [
      makePrompt("r1-p1", "a"),
      makePrompt("r1-p2", "b"),
      makePrompt("r2-p1", "a"),
      makePrompt("r2-p2", "b"),
    ];
    const guesses: ScoreGuessRow[] = [
      { promptId: "r1-p1", userId: "b", isCorrect: true, pointsAwarded: 100 },
      { promptId: "r1-p2", userId: "a", isCorrect: true, pointsAwarded: 100 },
      { promptId: "r2-p1", userId: "b", isCorrect: true, pointsAwarded: 100 },
      { promptId: "r2-p2", userId: "a", isCorrect: false, pointsAwarded: 0 },
    ];

    const map = computeCumulativeScores(
      allPrompts,
      buildGuessIndex(guesses),
      userMap,
    );

    // Alice: prompter r1 (50) + prompter r2 (50) + guesser r1-p2 (100) + guesser r2-p2 (0) = 200
    // Bob:   prompter r1 (50) + prompter r2 (0)  + guesser r1-p1 (100) + guesser r2-p1 (100) = 250
    expect(map["a"].score).toBe(200);
    expect(map["b"].score).toBe(250);
  });
});

describe("scoreMapToList", () => {
  it("projects a score map to an array of player score entries", () => {
    const list = scoreMapToList({
      a: { username: "Alice", score: 100 },
      b: { username: "Bob", score: 50 },
    });
    expect(list).toContainEqual({ userId: "a", username: "Alice", score: 100 });
    expect(list).toContainEqual({ userId: "b", username: "Bob", score: 50 });
    expect(list).toHaveLength(2);
  });
});
