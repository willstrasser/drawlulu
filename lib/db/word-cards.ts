import { db } from "@/lib/db";
import { wordCards } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { TabooEntry } from "@/lib/cards";

type RandomCardRow = { objective: string; taboos: TabooEntry[] };

async function selectRandomActive(
  count: number,
  category?: string,
): Promise<RandomCardRow[]> {
  const condition = category
    ? and(eq(wordCards.isActive, true), eq(wordCards.category, category))
    : eq(wordCards.isActive, true);

  return db
    .select({ objective: wordCards.objective, taboos: wordCards.taboos })
    .from(wordCards)
    .where(condition)
    .orderBy(sql`RANDOM()`)
    .limit(count);
}

export async function getWordCardsFromDB(
  count: number,
  category?: string,
): Promise<{ objective: string; taboos: string[] }[]> {
  let rows = await selectRandomActive(count, category);
  // Fall back to all categories if a category was requested but didn't yield enough cards.
  if (category && rows.length < count) {
    rows = await selectRandomActive(count);
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
    .where(eq(wordCards.isActive, true))
    .orderBy(wordCards.category);

  return rows.map((r) => r.category);
}
