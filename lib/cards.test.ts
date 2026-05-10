import { describe, expect, it } from "vitest";
import { isTabooEntry, isWordCard } from "./cards";

describe("isTabooEntry", () => {
  it("accepts a well-formed taboo entry", () => {
    expect(isTabooEntry({ word: "dragon", relevancyScore: 9 })).toBe(true);
  });

  it("rejects non-objects and null", () => {
    expect(isTabooEntry(null)).toBe(false);
    expect(isTabooEntry("dragon")).toBe(false);
    expect(isTabooEntry(42)).toBe(false);
    expect(isTabooEntry(undefined)).toBe(false);
  });

  it("rejects entries with missing or wrongly-typed fields", () => {
    expect(isTabooEntry({ word: "dragon" })).toBe(false);
    expect(isTabooEntry({ relevancyScore: 9 })).toBe(false);
    expect(isTabooEntry({ word: 1, relevancyScore: 9 })).toBe(false);
    expect(isTabooEntry({ word: "dragon", relevancyScore: "high" })).toBe(false);
  });
});

describe("isWordCard", () => {
  const valid = {
    objective: "Star Wars",
    category: "Movies",
    taboos: [
      { word: "Jedi", relevancyScore: 10 },
      { word: "lightsaber", relevancyScore: 9 },
    ],
  };

  it("accepts a well-formed word card", () => {
    expect(isWordCard(valid)).toBe(true);
  });

  it("rejects when objective is not a string", () => {
    expect(isWordCard({ ...valid, objective: 5 })).toBe(false);
  });

  it("rejects when category is not a string", () => {
    expect(isWordCard({ ...valid, category: undefined })).toBe(false);
  });

  it("rejects when taboos is not an array", () => {
    expect(isWordCard({ ...valid, taboos: "Jedi" })).toBe(false);
  });

  it("rejects when any taboo entry is malformed", () => {
    expect(
      isWordCard({
        ...valid,
        taboos: [{ word: "Jedi", relevancyScore: 10 }, { word: "missing-score" }],
      }),
    ).toBe(false);
  });
});
