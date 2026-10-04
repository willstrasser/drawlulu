import { NextResponse } from "next/server";
import { and, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { prompts, rounds, wordCards } from "@/lib/db/schema";
import { isPlayable } from "@/lib/db/word-cards";
import { checkCronAuth } from "@/lib/cron-auth";
import {
  ROTATION,
  countByCategory,
  normalizeObjective,
  pickCardsToSilence,
  planRefill,
} from "@/lib/card-rotation";
import { generateCards } from "@/lib/generate-cards";
import { log } from "@/lib/logger";

// Web search + generation can take a couple of minutes.
export const maxDuration = 300;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Daily deck refresh:
 * 1. Silence cards played in the last couple of weeks (they come back on
 *    their own when silenced_until passes).
 * 2. Generate new cards from current trends, aimed at categories that are
 *    now short, skipping anything already in the deck. When nobody has
 *    played recently and nothing is short, skip generation (and its cost).
 *
 * `?dryRun=1` reports the plan without writing or calling Claude.
 */
export async function GET(request: Request) {
  const denied = checkCronAuth(request);
  if (denied) return denied;

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const now = Date.now();
  const since = new Date(now - ROTATION.lookbackDays * DAY_MS);

  // ── 1. Silence recently played cards ─────────────────────────────────────
  const usage = await db
    .select({
      id: wordCards.id,
      category: wordCards.category,
      objective: wordCards.objective,
      uses: sql<number>`count(${prompts.id})::int`,
      lastUsedAt: sql<Date | null>`max(${prompts.createdAt})`,
    })
    .from(wordCards)
    .leftJoin(
      prompts,
      and(
        sql`lower(${prompts.targetWord}) = lower(${wordCards.objective})`,
        gt(prompts.createdAt, since),
      ),
    )
    .where(isPlayable())
    .groupBy(wordCards.id);

  const toSilence = pickCardsToSilence(
    usage.map((u) => ({
      ...u,
      lastUsedAt: u.lastUsedAt ? new Date(u.lastUsedAt) : null,
    })),
  );
  const silencedUntil = new Date(now + ROTATION.silenceDays * DAY_MS);

  if (!dryRun && toSilence.length > 0) {
    await db
      .update(wordCards)
      .set({ silencedUntil })
      .where(inArray(wordCards.id, toSilence));
  }

  // ── 2. Refill ────────────────────────────────────────────────────────────
  const silencedSet = new Set(toSilence);
  const stillPlayable = usage.filter((u) => !silencedSet.has(u.id));
  const playableByCategory = countByCategory(stillPlayable);

  const [activity] = await db
    .select({ recentRounds: sql<number>`count(*)::int` })
    .from(rounds)
    .where(
      gt(
        rounds.createdAt,
        new Date(now - ROTATION.activityLookbackDays * DAY_MS),
      ),
    );
  const recentRounds = activity?.recentRounds ?? 0;
  const plan = planRefill(playableByCategory, recentRounds > 0);

  const allObjectives = await db
    .select({ objective: wordCards.objective })
    .from(wordCards);
  const existingObjectives = allObjectives.map((r) => r.objective);

  const summary = {
    dryRun,
    silenced: usage
      .filter((u) => silencedSet.has(u.id))
      .map((u) => `${u.category}: ${u.objective}`),
    silencedUntil,
    playableByCategory: Object.fromEntries(playableByCategory),
    recentRounds,
    refill: { total: plan.total, deficits: Object.fromEntries(plan.deficits) },
  };

  if (dryRun) return NextResponse.json(summary);

  if (plan.total === 0) {
    log.info(
      "cron/refresh-cards",
      "Idle and fully stocked; skipped generation",
      {
        silenced: toSilence.length,
      },
    );
    return NextResponse.json({ ...summary, inserted: [], skipped: "idle" });
  }

  let generated;
  try {
    generated = await generateCards({
      total: plan.total,
      deficits: plan.deficits,
      categories: [...playableByCategory.keys()],
      existingObjectives,
    });
  } catch (error) {
    // Silencing already committed; it is still worth keeping on its own.
    log.error("cron/refresh-cards", "Card generation failed", error);
    return NextResponse.json(
      { ...summary, error: "Card generation failed" },
      { status: 500 },
    );
  }

  const seen = new Set(existingObjectives.map(normalizeObjective));
  const fresh = generated.filter((card) => {
    const key = normalizeObjective(card.objective);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (fresh.length > 0) {
    await db.insert(wordCards).values(
      fresh.map((card) => ({
        objective: card.objective.trim(),
        category: card.category.trim(),
        taboos: card.taboos,
        source: "ai_generated" as const,
      })),
    );
  }

  log.info("cron/refresh-cards", "Deck refreshed", {
    silenced: toSilence.length,
    inserted: fresh.length,
    duplicatesSkipped: generated.length - fresh.length,
  });

  return NextResponse.json({
    ...summary,
    inserted: fresh.map((c) => `${c.category}: ${c.objective}`),
    duplicatesSkipped: generated.length - fresh.length,
  });
}
