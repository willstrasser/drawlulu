import { describe, expect, it } from "vitest";
import { getCategories, getRandomCards, terms } from "./words";

describe("getCategories", () => {
  it("returns the category names from the in-memory term list", () => {
    const categories = getCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBe(terms.length);
    expect(categories.every((c) => typeof c === "string" && c.length > 0)).toBe(true);
  });
});

describe("getRandomCards", () => {
  it("returns the requested number of cards when enough are available across all categories", () => {
    const cards = getRandomCards(5);
    expect(cards).toHaveLength(5);
    for (const card of cards) {
      expect(typeof card.objective).toBe("string");
      expect(Array.isArray(card.taboos)).toBe(true);
      expect(card.taboos.every((t) => typeof t === "string")).toBe(true);
    }
  });

  it("returns at most `count` cards even when the source pool is smaller", () => {
    const cards = getRandomCards(9999);
    const totalAvailable = terms.flatMap((t) => t.cards).length;
    expect(cards.length).toBeLessThanOrEqual(9999);
    expect(cards.length).toBe(totalAvailable);
  });

  it("scopes results to a single category when one is provided", () => {
    const movieCards = getRandomCards(3, "Movies");
    const moviePool = terms.find((t) => t.category === "Movies")?.cards ?? [];
    expect(movieCards).toHaveLength(3);
    for (const card of movieCards) {
      expect(moviePool).toContainEqual(card);
    }
  });

  it("returns an empty array for an unknown category", () => {
    const cards = getRandomCards(5, "DefinitelyNotARealCategory");
    expect(cards).toEqual([]);
  });
});
