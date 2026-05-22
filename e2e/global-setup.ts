import dotenv from "dotenv";
import path from "path";
import { seedWordCards, cleanGameData } from "./helpers/db";

/**
 * Path where the live branch ID is stored so globalTeardown can delete it.
 * Written by scripts/pretest.ts, read by e2e/global-teardown.ts.
 */
export const BRANCH_ID_FILE = path.resolve(process.cwd(), ".neon-test-branch");

export default async function globalSetup(): Promise<void> {
  // Reload .env.test so all vars are available (the config process already
  // set most of them, but globalSetup runs in the same process and may need
  // to re-apply overrides after any dotenv chains).
  dotenv.config({
    path: path.resolve(process.cwd(), ".env.test"),
    override: true,
  });

  const required = [
    "DATABASE_URL",
    "SESSION_SECRET",
    "TEST_HOST_USERNAME",
    "TEST_PLAYER2_USERNAME",
  ];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(
        `Missing required env var "${key}" — add it to .env.test`,
      );
    }
  }

  // ── Seed / clean game data ───────────────────────────────────────────────
  // The Neon branch was created by scripts/pretest.ts and already has the
  // full schema (inherited from test-seed).  We just ensure the test word
  // cards are present and game tables are empty.
  await cleanGameData();
  await seedWordCards();

  // ── Warm up dev-server route compilation ─────────────────────────────────
  // `next dev` compiles routes on demand, and the first request to each can
  // take many seconds on CI hardware. Chained cold compiles push the host's
  // hostId-write effect past when the test starts clicking "Test Category".
  // Pre-compile every route the happy-path test touches.
  const base = "http://localhost:3000";
  const routes = [
    "/",
    "/api/auth/me",
    "/api/categories",
    "/api/games/WARMUP", // [code] dynamic route; 404 body, but route compiles
    "/game/WARMUP", // [code] dynamic route
  ];
  await Promise.all(
    routes.map((p) =>
      fetch(base + p).catch(() => {
        // Compile-only — ignore non-2xx and network blips.
      }),
    ),
  );
}
