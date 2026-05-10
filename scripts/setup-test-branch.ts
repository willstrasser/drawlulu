#!/usr/bin/env node
/**
 * One-time setup script: creates the "test-seed" Neon branch that all test
 * runs branch from.
 *
 * Run once after cloning the repo (or after a schema migration):
 *
 *   npx tsx scripts/setup-test-branch.ts
 *
 * What it does:
 *   1. Creates a branch called "test-seed" from the project's default branch.
 *   2. Truncates all data tables (we want schema only, no prod data).
 *   3. Seeds the two word cards that e2e tests depend on.
 *   4. Prints the branch ID — paste it into .env.test as NEON_PARENT_BRANCH_ID.
 *
 * Prerequisites:
 *   • NEON_API_KEY is set (in .env.test or the shell)
 *   • NEON_PROJECT_ID is set
 *   • The default branch already has all migrations applied
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: path.resolve(__dirname, "../.env.test"),
  override: true,
});

const NEON_API_BASE = "https://console.neon.tech/api/v2";

async function main() {
  const apiKey = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID;

  if (!apiKey || apiKey === "REPLACE_ME") {
    throw new Error("Set NEON_API_KEY in .env.test before running this script");
  }
  if (!projectId || projectId === "REPLACE_ME") {
    throw new Error(
      "Set NEON_PROJECT_ID in .env.test before running this script",
    );
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // ── 0. Resolve project name → ID ────────────────────────────────────────────
  // NEON_PROJECT_ID may be a human-readable name; look it up if needed.
  let resolvedProjectId = projectId;
  if (!/^[a-z]+-[a-z]+-[a-z0-9]{8}$/.test(projectId)) {
    console.log(`Resolving project name "${projectId}"…`);
    const listRes = await fetch(`${NEON_API_BASE}/projects?limit=100`, {
      headers,
    });
    const listData = (await listRes.json()) as {
      projects: { id: string; name: string }[];
    };
    const match = listData.projects?.find(
      (p) => p.name === projectId || p.id === projectId,
    );
    if (!match) {
      const names = listData.projects
        ?.map((p) => `"${p.name}" (${p.id})`)
        .join(", ");
      throw new Error(
        `Project "${projectId}" not found. Available: ${names || "(none)"}`,
      );
    }
    resolvedProjectId = match.id;
    console.log(`  → resolved to project ID: ${resolvedProjectId}`);
  }

  // ── 1. Create the test-seed branch ──────────────────────────────────────────
  console.log("Creating test-seed branch…");

  const createRes = await fetch(
    `${NEON_API_BASE}/projects/${resolvedProjectId}/branches`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        endpoints: [{ type: "read_write" }],
        branch: { name: "test-seed" },
      }),
    },
  );

  if (!createRes.ok) {
    throw new Error(
      `Failed to create branch (${createRes.status}): ${await createRes.text()}`,
    );
  }

  const data = (await createRes.json()) as {
    branch: { id: string; name: string };
    operations: { id: string; status: string }[];
    connection_uris: { connection_uri: string }[];
  };

  const branchId = data.branch.id;
  const uri = data.connection_uris?.[0]?.connection_uri;
  if (!uri) throw new Error("No connection URI in branch creation response");
  const connectionUri = uri.includes("sslmode")
    ? uri
    : `${uri}?sslmode=require`;

  // Wait for provisioning
  console.log("Waiting for branch to be ready…");
  for (const op of data.operations) {
    let status = op.status;
    while (status !== "finished") {
      await new Promise((r) => setTimeout(r, 500));
      const opRes = await fetch(
        `${NEON_API_BASE}/projects/${resolvedProjectId}/operations/${op.id}`,
        { headers },
      );
      const opData = (await opRes.json()) as { operation: { status: string } };
      status = opData.operation.status;
      if (status === "failed") throw new Error(`Operation ${op.id} failed`);
    }
  }

  // ── 2. Truncate all data tables (keep schema only) ───────────────────────────
  console.log("Truncating data tables…");
  const sql = neon(connectionUri);
  await sql`TRUNCATE users, games, rounds, prompts, word_cards, guesses CASCADE`;

  // ── 3. Seed test word cards ──────────────────────────────────────────────────
  console.log("Seeding test word cards…");
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
  `;

  // ── 4. Done ──────────────────────────────────────────────────────────────────
  console.log("\n✅ test-seed branch created successfully!");
  console.log(`   Branch ID: ${branchId}`);
  console.log(
    "\n👉 Add this to .env.test:\n   NEON_PARENT_BRANCH_ID=" + branchId,
  );
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
