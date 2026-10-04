import { describe, expect, it } from "vitest";
import {
  normalizeObjective,
  pickCardsToSilence,
  planRefill,
  type CardUsage,
} from "./card-rotation";

function deck(category: string, n: number, uses: number[] = []): CardUsage[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${category}-${i}`,
    category,
    uses: uses[i] ?? 0,
    lastUsedAt: uses[i] ? new Date(2026, 8, 1 + i) : null,
  }));
}

describe("pickCardsToSilence", () => {
  it("silences every recently used card when the category has room", () => {
    const cards = deck("Movies", 20, [1, 0, 2]);
    expect(pickCardsToSilence(cards, 8).sort()).toEqual([
      "Movies-0",
      "Movies-2",
    ]);
  });

  it("never drops a category below the floor, keeping the least-played back", () => {
    const cards = deck("Music", 10, [1, 3, 2, 1]);
    // Room for 2 silences (10 → 8): the two most-played go.
    expect(pickCardsToSilence(cards, 8)).toEqual(["Music-1", "Music-2"]);
  });

  it("breaks ties on uses by most recent play", () => {
    const cards = deck("Tech", 9, [1, 1, 1]);
    expect(pickCardsToSilence(cards, 8)).toEqual(["Tech-2"]);
  });

  it("applies the floor per category", () => {
    const cards = [...deck("A", 5, [1, 1]), ...deck("B", 12, [1, 1])];
    expect(pickCardsToSilence(cards, 8).sort()).toEqual(["B-0", "B-1"]);
  });

  it("silences nothing when nothing was played", () => {
    expect(pickCardsToSilence(deck("Places", 30), 8)).toEqual([]);
  });
});

describe("planRefill", () => {
  it("fills categories up to the target and caps the total", () => {
    const { deficits, total } = planRefill(
      new Map([
        ["Music", 5],
        ["Tech", 15],
        ["Holidays", 10],
      ]),
      12,
    );
    expect(Object.fromEntries(deficits)).toEqual({ Music: 7, Holidays: 2 });
    expect(total).toBe(9);
  });

  it("still generates a few cards when nothing is short", () => {
    expect(planRefill(new Map([["Movies", 30]]), 12).total).toBe(3);
  });

  it("caps generation per run", () => {
    expect(
      planRefill(
        new Map([
          ["A", 0],
          ["B", 0],
        ]),
        12,
      ).total,
    ).toBe(12);
  });

  it("ignores the test category", () => {
    const { deficits } = planRefill(new Map([["Test Category", 2]]), 12);
    expect(deficits.size).toBe(0);
  });
});

describe("normalizeObjective", () => {
  it("treats case, punctuation, accents and a leading 'The' as equal", () => {
    expect(normalizeObjective("The Matrix")).toBe(normalizeObjective("matrix"));
    expect(normalizeObjective("Beyoncé")).toBe(normalizeObjective("beyonce"));
    expect(normalizeObjective("Spider-Man: No Way Home")).toBe(
      "spider man no way home",
    );
  });
});
