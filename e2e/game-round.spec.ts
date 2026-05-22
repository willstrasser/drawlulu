/**
 * E2E: Full happy-path game round
 *
 * Two browser contexts simulate two players (host + player 2) playing through
 * a complete round:
 *   lobby → prompting → generating → guessing (×2 images) → scoreboard
 *
 * Key shortcuts that keep the test fast without changing app logic:
 *  - allSubmitted effect: when both players submit prompts the timer expires
 *    immediately (already in page.tsx).
 *  - DevPanel "Expire Timer" button: host advances the guessing phase after
 *    each image (button visible to everyone in dev mode).
 *  - MOCK_FAL=true: generate route returns a placeholder URL instantly.
 *
 * Database isolation strategy:
 *  - globalSetup creates a fresh Neon branch per run → the branch already has
 *    the right schema and word cards, with zero game data.
 *  - globalTeardown deletes the branch → no manual cleanup needed between runs.
 *  - cleanGameData() in afterEach handles isolation *within* a run when there
 *    are multiple tests.
 */

import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { signInAsHost, signInAsPlayer2 } from "./helpers/auth";
import { cleanGameData } from "./helpers/db";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Returns true if this player owns the currently-displayed image. */
async function isMyImage(page: Page): Promise<boolean> {
  return page.getByText("This is your image!").isVisible();
}

/**
 * Submit a guess if this player can (i.e. it is not their image and they
 * haven't already guessed correctly).
 */
async function tryGuess(page: Page, guessText: string): Promise<void> {
  if (await isMyImage(page)) return;
  if (await page.getByText("You guessed correctly!").isVisible()) return;

  await page.getByPlaceholder("Type your guess...").fill(guessText);
  await page.getByRole("button", { name: "Guess!" }).click();
}

// ─── fixture setup ────────────────────────────────────────────────────────────

let hostCtx: BrowserContext;
let p2Ctx: BrowserContext;
let hostPage: Page;
let p2Page: Page;

test.beforeEach(async ({ browser }) => {
  hostCtx = await browser.newContext();
  p2Ctx = await browser.newContext();
  hostPage = await hostCtx.newPage();
  p2Page = await p2Ctx.newPage();

  // signInAs* navigates to '/', POSTs to /api/auth/guest, reloads, and waits
  // for the username to appear in the nav before returning.
  await Promise.all([signInAsHost(hostPage), signInAsPlayer2(p2Page)]);
});

test.afterEach(async () => {
  await Promise.all([hostCtx.close(), p2Ctx.close()]);
  await cleanGameData();
});

// ─── main test ────────────────────────────────────────────────────────────────

test("full happy-path round: lobby → prompting → generating → guessing → scoreboard", async () => {
  // ── LOBBY: host creates the game ──────────────────────────────────────────
  // After signInAsHost the page is already at '/'.
  await hostPage.getByRole("button", { name: "Create Game" }).click();
  await hostPage.waitForURL(/\/game\//);
  const roomCode = hostPage.url().split("/game/")[1]!;
  expect(roomCode).toMatch(/^[A-Z0-9]{4,8}$/);

  // ── LOBBY: player 2 joins ─────────────────────────────────────────────────
  // p2Page is at '/' after signInAsPlayer2.
  await p2Page.getByPlaceholder("Enter room code").fill(roomCode);
  await p2Page.getByRole("button", { name: "Join" }).click();
  await p2Page.waitForURL(`**/game/${roomCode}`);

  // Both players see the lobby
  await expect(hostPage.getByText("Game Lobby")).toBeVisible();
  await expect(p2Page.getByText("Game Lobby")).toBeVisible();

  // Only the host sees the Start button; player 2 does not
  await expect(
    p2Page.getByRole("button", { name: "Start Game" }),
  ).not.toBeVisible();

  // ── LOBBY: host selects category and starts ───────────────────────────────
  // Categories are fetched from /api/categories; wait for the seeded category.
  // With many categories the button may be below the fold — scroll it into view
  // before asserting visibility so the check doesn't fail on a clipped layout.
  const testCategoryBtn = hostPage.getByRole("button", {
    name: "Test Category",
  });
  await testCategoryBtn.scrollIntoViewIfNeeded();
  await expect(testCategoryBtn).toBeVisible({ timeout: 10_000 });
  await testCategoryBtn.click();

  const startBtn = hostPage.getByRole("button", { name: "Start Game" });
  await expect(startBtn).toBeEnabled({ timeout: 10_000 });
  await startBtn.click();

  // ── PROMPTING: both players receive a word assignment ────────────────────
  await expect(hostPage.getByText("Your target word is:")).toBeVisible({
    timeout: 20_000,
  });
  await expect(p2Page.getByText("Your target word is:")).toBeVisible({
    timeout: 20_000,
  });

  // ── ASSERTION: taboo-word validation ─────────────────────────────────────
  // Read the host's target word from the prominent h2 heading.
  // Seeds: Sun → taboos [Star, Hot, Light]; Moon → taboos [Night, Lunar, Orbit]
  const hostTarget = await hostPage
    .getByRole("heading", { level: 2 })
    .first()
    .textContent();
  const tabooMap: Record<string, string> = { Sun: "Star", Moon: "Night" };
  const hostTaboo = hostTarget ? tabooMap[hostTarget.trim()] : undefined;

  if (hostTaboo) {
    // Deliberately use the taboo word — the prompt still submits but shows a warning.
    await hostPage
      .getByPlaceholder("Describe an image that hints at your target word...")
      .fill(`A bright ${hostTaboo.toLowerCase()} in the sky`);
    await hostPage.getByRole("button", { name: "Submit Prompt" }).click();

    await expect(hostPage.getByText("Taboo words detected:")).toBeVisible({
      timeout: 10_000,
    });
    // await expect(hostPage.getByText("Prompt Submitted!")).toBeVisible();
  } else {
    // Fallback for unexpected seed state
    await hostPage
      .getByPlaceholder("Describe an image that hints at your target word...")
      .fill("A beautiful spherical object visible in the sky");
    await hostPage.getByRole("button", { name: "Submit Prompt" }).click();
    await expect(hostPage.getByText("Prompt Submitted!")).toBeVisible();
  }

  // Player 2 submits a clean prompt
  await p2Page
    .getByPlaceholder("Describe an image that hints at your target word...")
    .fill("A softly glowing disc rising after sunset");
  await p2Page.getByRole("button", { name: "Submit Prompt" }).click();
  await expect(p2Page.getByText("Prompt Submitted!")).toBeVisible();

  // Both submitted → allSubmitted effect fires on host → timer collapses to
  // now → useGameTimer calls /api/generate → phase transitions to GENERATING.
  // Host reliably shows GENERATING; with MOCK_FAL the response is instant so
  // p2 may have already transitioned to GUESSING before we can catch it.
  await expect(hostPage.getByText("Generating Images...")).toBeVisible({
    timeout: 30_000,
  });

  // ── GUESSING: cycle through all 2 images ─────────────────────────────────
  for (let imageNum = 1; imageNum <= 2; imageNum++) {
    await expect(hostPage.getByText(`Image ${imageNum} of 2`)).toBeVisible({
      timeout: 30_000,
    });
    await expect(p2Page.getByText(`Image ${imageNum} of 2`)).toBeVisible({
      timeout: 10_000,
    });

    // ── ASSERTION: player cannot guess their own image ──────────────────────
    const hostOwns = await isMyImage(hostPage);
    const p2Owns = await isMyImage(p2Page);
    // Exactly one player owns each image
    expect(hostOwns !== p2Owns).toBe(true);

    if (hostOwns) {
      // Host's own image: the guess input must be absent for the host
      await expect(
        hostPage.getByPlaceholder("Type your guess..."),
      ).not.toBeVisible();
    } else {
      // Player 2's own image: the guess input must be absent for player 2
      await expect(
        p2Page.getByPlaceholder("Type your guess..."),
      ).not.toBeVisible();
    }

    // Submit guesses; tryGuess skips the owner silently. Use intentionally-
    // wrong guesses so the auto-skip-on-all-correct path in GamePage doesn't
    // race with our manual phase advancement below — this test exercises the
    // manual DevPanel timer-expiry flow.
    await tryGuess(hostPage, "definitelywrong");
    await tryGuess(p2Page, "definitelywrong");

    // Advance to the next image / scoreboard via the DevPanel.
    // The button is disabled until timerEndsAt is set (which happens as soon
    // as the host's useGameTimer enters the guessing phase).
    const expireBtn = hostPage.getByRole("button", {
      name: "Expire Timer (skip phase)",
    });
    await expect(expireBtn).toBeEnabled({ timeout: 10_000 });
    // First click: end GUESSING → enters REVEALING
    await expireBtn.click();
    // Second click: skip REVEALING → advances to next image or scoreboard
    await expect(expireBtn).toBeEnabled({ timeout: 5_000 });
    await expireBtn.click();
  }

  // ── SCOREBOARD ────────────────────────────────────────────────────────────
  await expect(hostPage.getByText("Round 1 Results")).toBeVisible({
    timeout: 30_000,
  });
  await expect(p2Page.getByText("Round 1 Results")).toBeVisible({
    timeout: 30_000,
  });

  // Both players should appear with a score line (e.g. "42pts")
  await expect(hostPage.getByText(/\d+pts/).first()).toBeVisible();
  await expect(p2Page.getByText(/\d+pts/).first()).toBeVisible();

  // ── PLAY AGAIN: must transition directly to PROMPTING (no lobby) ──────────
  await hostPage.getByRole("button", { name: "Next Round" }).click();

  await expect(hostPage.getByText("Your target word is:")).toBeVisible({
    timeout: 20_000,
  });
  await expect(p2Page.getByText("Your target word is:")).toBeVisible({
    timeout: 20_000,
  });

  // The lobby heading must NOT have appeared between scoreboard and prompting
  await expect(hostPage.getByText("Game Lobby")).not.toBeVisible();
});
