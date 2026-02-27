#!/usr/bin/env tsx
/**
 * Runs before `npm run test:e2e` (via the "pretest:e2e" npm lifecycle hook).
 *
 * Order of operations:
 *   1. Clean up stale .neon-branch-url / .neon-test-branch from a previous crash.
 *   2. Kill whatever process is listening on port 3000 (the Next.js dev server).
 *   3. Create a fresh Neon branch and write its URL + ID to temp files.
 *      playwright.config.ts reads .neon-branch-url at config-load time so it
 *      can pass DATABASE_URL explicitly in webServer.env — before globalSetup
 *      runs and before the webServer is spawned.
 *
 * Why this must run before Playwright:
 *   In Playwright ≥ 1.30, plugins (including the webServer plugin) are set up
 *   BEFORE globalSetup.  The webServer process must receive DATABASE_URL via
 *   webServer.env (captured at config-load time), not via process.env mutations
 *   in globalSetup (which runs too late).
 */

import dotenv from "dotenv";
import path from "path";
import { execSync, spawnSync } from "child_process";
import { existsSync, writeFileSync, unlinkSync } from "fs";
import { createTestBranch, neonBranchingEnabled } from "../e2e/helpers/neon";

const BRANCH_ID_FILE = path.resolve(process.cwd(), ".neon-test-branch");
const BRANCH_URL_FILE = path.resolve(process.cwd(), ".neon-branch-url");

dotenv.config({
  path: path.resolve(process.cwd(), ".env.test"),
  override: true,
});

async function main() {
  // ── 1. Clean up stale files from a previous crashed run ───────────────────
  for (const file of [BRANCH_ID_FILE, BRANCH_URL_FILE]) {
    if (existsSync(file)) {
      console.log(`[pretest] Removing stale ${path.basename(file)}`);
      unlinkSync(file);
    }
  }

  // ── 2. Kill any process listening on port 3000 ─────────────────────────────
  try {
    const pid = execSync(
      "lsof -ti:3000 -sTCP:LISTEN 2>/dev/null | head -1",
      { shell: true }
    )
      .toString()
      .trim();
    if (pid) {
      execSync(`kill ${pid}`, { stdio: "ignore" });
      // Give the process time to exit and release .next/dev/lock
      spawnSync("sleep", ["1.2"]);
      console.log(`[pretest] Stopped dev server (pid ${pid})`);
    }
  } catch {
    // No process on port 3000 — fine
  }

  // ── 3. Create Neon branch (or fall back to TEST_DATABASE_URL) ─────────────
  if (neonBranchingEnabled()) {
    const runId = `test-${Date.now()}`;
    console.log(`[pretest] Creating Neon branch "${runId}"…`);
    const { branchId, connectionUri } = await createTestBranch(runId);
    writeFileSync(BRANCH_ID_FILE, branchId, "utf8");
    writeFileSync(BRANCH_URL_FILE, connectionUri, "utf8");
    console.log(`[pretest] Branch ready (${branchId})`);
  } else {
    const fallback = process.env.TEST_DATABASE_URL;
    if (!fallback) throw new Error("TEST_DATABASE_URL must be set in .env.test");
    writeFileSync(BRANCH_URL_FILE, fallback, "utf8");
    console.log("[pretest] NEON_API_KEY not configured — using TEST_DATABASE_URL");
  }
}

main().catch((err) => {
  console.error("[pretest] Error:", err.message);
  process.exit(1);
});
