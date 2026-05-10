import { describe, expect, it } from "vitest";
import { generateRoomCode, validateTabooWords } from "./utils";

describe("generateRoomCode", () => {
  it("returns a 6-character code from the allowed alphabet", () => {
    const allowed = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code).toMatch(allowed);
    }
  });

  it("excludes ambiguous characters (I, O, 0, 1)", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).not.toMatch(/[IO01]/);
    }
  });
});

describe("validateTabooWords", () => {
  it("returns the original prompt and empty list when no taboos match", () => {
    const result = validateTabooWords("a friendly llama drawing", ["dragon", "spaceship"]);
    expect(result.sanitizedPrompt).toBe("a friendly llama drawing");
    expect(result.forbiddenWordsUsed).toEqual([]);
  });

  it("matches case-insensitively and replaces with ___", () => {
    const result = validateTabooWords("DRAGON breathing fire", ["dragon"]);
    expect(result.forbiddenWordsUsed).toEqual(["dragon"]);
    expect(result.sanitizedPrompt).toBe("___ breathing fire");
  });

  it("handles multi-word taboos (whole-phrase match)", () => {
    const result = validateTabooWords(
      "I love playing video game console all day",
      ["video game"],
    );
    expect(result.forbiddenWordsUsed).toEqual(["video game"]);
    expect(result.sanitizedPrompt).toBe("I love playing ___ console all day");
  });

  it("escapes regex metacharacters in taboo terms", () => {
    const result = validateTabooWords("the price is $5.00", ["$5.00"]);
    expect(result.forbiddenWordsUsed).toEqual(["$5.00"]);
    expect(result.sanitizedPrompt).toBe("the price is ___");
  });

  it("collects multiple distinct taboo hits and replaces each", () => {
    const result = validateTabooWords(
      "Mafia don in New York",
      ["Mafia", "Don Corleone", "New York"],
    );
    expect(result.forbiddenWordsUsed.sort()).toEqual(["Mafia", "New York"]);
    expect(result.sanitizedPrompt).toBe("___ don in ___");
  });

  it("replaces every occurrence of a matching taboo (global flag)", () => {
    const result = validateTabooWords("dragon dragon DRAGON", ["dragon"]);
    expect(result.forbiddenWordsUsed).toEqual(["dragon"]);
    expect(result.sanitizedPrompt).toBe("___ ___ ___");
  });
});
