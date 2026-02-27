import { db } from "@/lib/db";
import { wordCards } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function getWordCardsFromDB(
  count: number,
  category?: string
): Promise<{ objective: string; taboos: string[] }[]> {
  const condition = category
    ? and(eq(wordCards.isActive, true), eq(wordCards.category, category))
    : eq(wordCards.isActive, true);

  const rows = await db
    .select({ objective: wordCards.objective, taboos: wordCards.taboos })
    .from(wordCards)
    .where(condition)
    .orderBy(sql`RANDOM()`);

  // Fall back to all categories if not enough cards in the requested category
  const source =
    rows.length >= count
      ? rows
      : await db
          .select({ objective: wordCards.objective, taboos: wordCards.taboos })
          .from(wordCards)
          .where(eq(wordCards.isActive, true))
          .orderBy(sql`RANDOM()`);

  return source.slice(0, count).map((row) => ({
    objective: row.objective,
    taboos: (
      row.taboos as Array<{ word: string; relevancyScore: number }>
    ).map((t) => t.word),
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
