/**
 * dev-bot.ts — fill empty seats with bot players against a running dev server.
 *
 * Usage:
 *   npm run dev:bot -- --room ABCDEF [--count 2] [--username-prefix Bot]
 *
 * Each bot opens its own headed Chromium context, signs up as a guest, joins
 * the room, and loops:
 *   • Prompt phase  → submit a fixed prompt
 *   • Guess phase   → submit a random guess from a small word bank (once per image)
 *   • Other phases  → wait
 *
 * The host (you, in your real browser) drives the round; bots just keep the
 * game advanceable. Ctrl-C to stop.
 */

import { chromium, type Browser, type Page } from "@playwright/test";

const PROMPT_TEXT = "a colorful drawing in a busy scene";
const GUESS_WORDS = [
  "cat",
  "dog",
  "tree",
  "house",
  "car",
  "moon",
  "fish",
  "robot",
  "pizza",
  "ghost",
];
const HOST = process.env.DEV_HOST ?? "http://localhost:3000";
const POLL_MS = 500;

type Args = { room: string; count: number; usernamePrefix: string };

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  const room = flag("--room") ?? "";
  if (!/^[A-Z0-9]{6}$/.test(room)) {
    console.error(
      "Usage: npm run dev:bot -- --room <ABCDEF> [--count N] [--username-prefix Bot]",
    );
    console.error("  --room: required, 6 uppercase alphanumerics");
    process.exit(1);
  }

  const count = Number(flag("--count") ?? "1");
  if (!Number.isInteger(count) || count < 1 || count > 10) {
    console.error("--count must be an integer 1..10 (default 1)");
    process.exit(1);
  }

  const usernamePrefix = flag("--username-prefix") ?? "Bot";
  return { room, count, usernamePrefix };
}

async function signUpAsGuest(page: Page, username: string): Promise<void> {
  await page.goto(`${HOST}/`);
  await page.evaluate(async (name: string) => {
    const res = await fetch("/api/auth/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: name }),
    });
    if (!res.ok) throw new Error(`/api/auth/guest → ${res.status}`);
  }, username);
}

async function runBot(
  browser: Browser,
  room: string,
  username: string,
): Promise<void> {
  const context = await browser.newContext();
  const page = await context.newPage();

  await signUpAsGuest(page, username);
  await page.goto(`${HOST}/game/${room}`);
  console.log(`[${username}] joined room ${room}`);

  let lastGuessedImage: string | null = null;

  while (true) {
    try {
      const promptTextarea = page.getByPlaceholder(
        "Describe an image that hints at your target word...",
      );
      const guessInput = page.getByPlaceholder("Type your guess...");
      const isMineMsg = page.getByText("This is your image!");
      const correctMsg = page.getByText("You guessed correctly!");

      // Prompt phase: textarea is mounted only while the bot hasn't submitted.
      // After submit, PromptPhase swaps to a "Prompt Submitted!" view, so
      // visibility is a sufficient idempotency check.
      if (await promptTextarea.isVisible().catch(() => false)) {
        await promptTextarea.fill(PROMPT_TEXT);
        await page.getByRole("button", { name: "Submit Prompt" }).click();
        console.log(`[${username}] submitted prompt`);
      }

      // Guess phase: skip if it's the bot's own image, skip if already guessed
      // correctly. Per-image dedupe via the "Image N of M" header so the bot
      // doesn't spam the same image with multiple guesses.
      if (await guessInput.isVisible().catch(() => false)) {
        const isMine = await isMineMsg.isVisible().catch(() => false);
        const correct = await correctMsg.isVisible().catch(() => false);
        if (!isMine && !correct) {
          const imageId = await page
            .locator("text=/Image \\d+ of \\d+/")
            .first()
            .textContent()
            .catch(() => null);
          if (imageId && imageId !== lastGuessedImage) {
            const word =
              GUESS_WORDS[Math.floor(Math.random() * GUESS_WORDS.length)] ??
              "thing";
            await guessInput.fill(word);
            await page.getByRole("button", { name: "Guess!" }).click();
            console.log(`[${username}] guessed "${word}" on ${imageId}`);
            lastGuessedImage = imageId;
          }
        }
      }

      await page.waitForTimeout(POLL_MS);
    } catch (e) {
      console.error(`[${username}] loop error:`, (e as Error).message);
      await page.waitForTimeout(1000);
    }
  }
}

async function main(): Promise<void> {
  const { room, count, usernamePrefix } = parseArgs();
  console.log(
    `Launching ${count} bot${count === 1 ? "" : "s"} for room ${room}…`,
  );

  const browser = await chromium.launch({ headless: false });

  const shutdown = async () => {
    console.log("\nShutting down bots…");
    await browser.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  const bots = Array.from({ length: count }, (_, i) =>
    runBot(browser, room, `${usernamePrefix}${i + 1}`),
  );
  await Promise.all(bots);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
