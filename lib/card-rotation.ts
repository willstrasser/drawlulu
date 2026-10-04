// Pure decision logic for the refresh-cards cron. DB access lives in the
// route; everything here is deterministic so it can be unit-tested.

export const ROTATION = {
  /** A card played within this window counts as "recently used". */
  lookbackDays: 14,
  /** How long a recently used card sits out. */
  silenceDays: 21,
  /** Never silence a category below this many playable cards. */
  minPlayablePerCategory: 8,
  /** Categories below this many playable cards get topped up. */
  targetPlayablePerCategory: 12,
  /** Games played within this window count as recent activity. */
  activityLookbackDays: 7,
  /** Bounds on cards generated per run. Only active decks get the minimum. */
  minNewCards: 3,
  maxNewCards: 12,
} as const;

/** Categories that exist for tests/tooling and must never be refilled. */
export const EXCLUDED_CATEGORIES = new Set(["Test Category"]);

export type CardUsage = {
  id: string;
  category: string;
  /** Plays within the lookback window. */
  uses: number;
  lastUsedAt: Date | null;
};

/**
 * Picks recently played cards to silence, most-played (then most recent)
 * first, without dropping any category below the playable floor.
 */
export function pickCardsToSilence(
  playable: CardUsage[],
  minPlayable: number = ROTATION.minPlayablePerCategory,
): string[] {
  const remaining = countByCategory(playable);

  const candidates = playable
    .filter((c) => c.uses > 0)
    .sort(
      (a, b) =>
        b.uses - a.uses ||
        (b.lastUsedAt?.getTime() ?? 0) - (a.lastUsedAt?.getTime() ?? 0),
    );

  const silenced: string[] = [];
  for (const card of candidates) {
    const left = remaining.get(card.category) ?? 0;
    if (left <= minPlayable) continue;
    remaining.set(card.category, left - 1);
    silenced.push(card.id);
  }
  return silenced;
}

/**
 * How many new cards each category needs to get back to the target, plus the
 * total to generate this run. While people are playing, always add a few so
 * the deck stays fresh; while idle, only fill real shortfalls (often zero, so
 * the run makes no Claude call at all).
 */
export function planRefill(
  playableByCategory: Map<string, number>,
  recentlyActive: boolean,
  target: number = ROTATION.targetPlayablePerCategory,
): { deficits: Map<string, number>; total: number } {
  const deficits = new Map<string, number>();
  let sum = 0;
  for (const [category, count] of playableByCategory) {
    if (EXCLUDED_CATEGORIES.has(category)) continue;
    const need = target - count;
    if (need > 0) {
      deficits.set(category, need);
      sum += need;
    }
  }
  const floor = recentlyActive ? ROTATION.minNewCards : 0;
  const total = Math.min(ROTATION.maxNewCards, Math.max(floor, sum));
  return { deficits, total };
}

export function countByCategory(cards: { category: string }[]) {
  const counts = new Map<string, number>();
  for (const c of cards)
    counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  return counts;
}

export function normalizeObjective(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
