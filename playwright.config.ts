import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { existsSync, readFileSync } from "fs";
import path from "path";

// Load test env vars so they are available when Playwright evaluates this
// config AND when it spawns the globalSetup process.
dotenv.config({ path: path.resolve(__dirname, ".env.test"), override: true });

// Read the Neon branch URL written by `scripts/pretest.ts` (which runs via the
// "pretest:e2e" npm hook before Playwright starts).
//
// IMPORTANT: In Playwright ≥ 1.30 the webServer plugin is set up BEFORE
// globalSetup runs, so DATABASE_URL MUST be passed explicitly via webServer.env
// (captured here at config-load time) — mutations to process.env in globalSetup
// happen too late for the webServer to pick them up.
const branchUrlFile = path.resolve(__dirname, ".neon-branch-url");
const databaseUrl = existsSync(branchUrlFile)
  ? readFileSync(branchUrlFile, "utf8").trim()
  : (process.env.TEST_DATABASE_URL ?? "");

process.env.DATABASE_URL = databaseUrl;

export default defineConfig({
  testDir: "./e2e",

  // Per-test timeout — generous because real async waits are involved
  timeout: 120_000,
  // Assertion timeout
  expect: { timeout: 15_000 },

  // Serial execution — multiplayer tests share a Liveblocks room;
  // parallel runs would collide.
  fullyParallel: false,
  workers: 1,
  retries: 0,

  reporter: [["list"], ["html", { open: "never" }]],

  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    // pretest.ts kills any existing server before Playwright starts, so
    // this never fails on a busy port in normal usage.
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      // Point the app at the ephemeral Neon branch (or TEST_DATABASE_URL
      // fallback).  Set explicitly here so the webServer receives it even
      // though Next.js's dotenv loading would otherwise load .env (prod URL).
      DATABASE_URL: databaseUrl,
      // Stub FAL — returns a placeholder image URL instantly.
      MOCK_FAL: "true",
      // Clerk, Liveblocks keys from .env.test (test instances).
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? "",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
      LIVEBLOCKS_SECRET_KEY: process.env.LIVEBLOCKS_SECRET_KEY ?? "",
    },
  },
});
