import { db } from "@/lib/db";
import { wordCards } from "@/lib/db/schema";
import {
  and,
  eq,
  isNull,
  lte,
  notInArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { TabooEntry } from "@/lib/cards";

type RandomCardRow = { objective: string; taboos: TabooEntry[] };

/** Active and not temporarily silenced by the refresh-cards cron. */
export function isPlayable(): SQL {
  return and(
    eq(wordCards.isActive, true),
    or(
      isNull(wordCards.silencedUntil),
      lte(wordCards.silencedUntil, sql`now()`),
    ),
  )!;
}

async function selectRandomPlayable(
  count: number,
  category: string | undefined,
  excludeObjectives: string[],
): Promise<RandomCardRow[]> {
  const conditions = [isPlayable()];
  if (category) conditions.push(eq(wordCards.category, category));
  if (excludeObjectives.length > 0) {
    conditions.push(notInArray(wordCards.objective, excludeObjectives));
  }

  return db
    .select({ objective: wordCards.objective, taboos: wordCards.taboos })
    .from(wordCards)
    .where(and(...conditions))
    .orderBy(sql`RANDOM()`)
    .limit(count);
}

export async function getWordCardsFromDB(
  count: number,
  category?: string,
  excludeObjectives: string[] = [],
): Promise<{ objective: string; taboos: string[] }[]> {
  let rows = await selectRandomPlayable(count, category, excludeObjectives);
  // Fall back to all categories if a category was requested but didn't yield enough cards.
  if (category && rows.length < count) {
    rows = await selectRandomPlayable(count, undefined, excludeObjectives);
  }
  // Repeats within a game beat failing to start the round.
  if (rows.length < count && excludeObjectives.length > 0) {
    rows = await selectRandomPlayable(count, undefined, []);
  }

  return rows.map((row) => ({
    objective: row.objective,
    taboos: row.taboos.map((t) => t.word),
  }));
}

export async function getActiveCategories(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: wordCards.category })
    .from(wordCards)
    .where(isPlayable())
    .orderBy(wordCards.category);

  return rows.map((r) => r.category);
}
