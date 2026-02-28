/**
 * Lightweight DB helpers for e2e tests.
 *
 * Uses @neondatabase/serverless's tagged-template SQL directly to avoid
 * importing from @/lib/ (which carries Next.js-only module settings).
 *
 * IMPORTANT: reads DATABASE_URL, not TEST_DATABASE_URL.  globalSetup sets
 * DATABASE_URL to the fresh branch connection string before the webServer and
 * these helpers run, so all operations go to the isolated test branch.
 */
import { neon } from "@neondatabase/serverless";

function getTestSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

/**
 * Seed two word cards under "Test Category" so:
 *  - /api/categories returns at least one selectable option in the lobby.
 *  - /api/games/[code]/start can assign cards without calling the AI cron.
 *
 * ON CONFLICT DO NOTHING makes this idempotent.
 */
export async function seedWordCards(): Promise<void> {
  const sql = getTestSql();
  await sql`
    INSERT INTO word_cards (objective, category, taboos, source, is_active)
    VALUES
      (
        'Sun',
        'Test Category',
        '[{"word":"Star","relevancyScore":8},{"word":"Hot","relevancyScore":7},{"word":"Light","relevancyScore":6}]',
        'system',
        true
      ),
      (
        'Moon',
        'Test Category',
        '[{"word":"Night","relevancyScore":9},{"word":"Lunar","relevancyScore":8},{"word":"Orbit","relevancyScore":5}]',
        'system',
        true
      )
    ON CONFLICT DO NOTHING
  `;
}

/**
 * Delete all game-session rows in FK-safe order.
 *
 * With Neon branching this is only needed between tests within the same run
 * (the branch itself is discarded by globalTeardown).  Without branching it
 * is also called in globalSetup for a clean slate.
 */
export async function cleanGameData(): Promise<void> {
  const sql = getTestSql();
  await sql`DELETE FROM guesses`;
  await sql`DELETE FROM prompts`;
  await sql`DELETE FROM rounds`;
  await sql`DELETE FROM games`;
  await sql`DELETE FROM users`;
}
