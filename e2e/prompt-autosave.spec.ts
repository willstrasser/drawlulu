/**
 * E2E: a player who runs out of time still gets an image.
 *
 * Player 2 types a prompt but never presses Submit. Once the draft has
 * autosaved, the prompting timer runs out (forced via the DevPanel "Expire
 * Timer" button, which sets timerEndsAt to now exactly like a real timeout).
 * Generation must use the draft, so both images render.
 */

import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { signInAsHost, signInAsPlayer2 } from "./helpers/auth";
import { cleanGameData } from "./helpers/db";

const PROMPT_PLACEHOLDER =
  "Describe an image that hints at your target word...";

let hostCtx: BrowserContext;
let p2Ctx: BrowserContext;
let hostPage: Page;
let p2Page: Page;

test.beforeEach(async ({ browser }) => {
  hostCtx = await browser.newContext();
  p2Ctx = await browser.newContext();
  hostPage = await hostCtx.newPage();
  p2Page = await p2Ctx.newPage();
  await Promise.all([signInAsHost(hostPage), signInAsPlayer2(p2Page)]);
});

test.afterEach(async () => {
  await Promise.all([hostCtx.close(), p2Ctx.close()]);
  await cleanGameData();
});

test("an unsubmitted draft is used when the prompting timer runs out", async () => {
  // ── Lobby → prompting ─────────────────────────────────────────────────────
  await hostPage.getByRole("button", { name: "Create Game" }).click();
  await hostPage.waitForURL(/\/game\//);
  const roomCode = hostPage.url().split("/game/")[1]!;

  await p2Page.getByPlaceholder("Enter room code").fill(roomCode);
  await p2Page.getByRole("button", { name: "Join" }).click();
  await p2Page.waitForURL(`**/game/${roomCode}`);

  const testCategoryBtn = hostPage.getByRole("button", {
    name: "Test Category",
  });
  await testCategoryBtn.scrollIntoViewIfNeeded();
  await expect(testCategoryBtn).toBeEnabled({ timeout: 10_000 });
  await testCategoryBtn.click();
  const startBtn = hostPage.getByRole("button", { name: "Start Game" });
  await expect(startBtn).toBeEnabled({ timeout: 10_000 });
  await startBtn.click();

  await expect(hostPage.getByText("Your target word is:")).toBeVisible({
    timeout: 20_000,
  });
  await expect(p2Page.getByText("Your target word is:")).toBeVisible({
    timeout: 20_000,
  });

  // ── Host submits; player 2 only types ─────────────────────────────────────
  await hostPage
    .getByPlaceholder(PROMPT_PLACEHOLDER)
    .fill("A glowing circle in the sky");
  await hostPage.getByRole("button", { name: "Submit Prompt" }).click();
  await expect(hostPage.getByText("Prompt Submitted!")).toBeVisible();

  // The draft autosaves shortly after typing stops — no Submit press.
  const draftSaved = p2Page.waitForResponse(
    (r) => r.url().endsWith("/prompt") && r.request().method() === "POST",
    { timeout: 30_000 },
  );
  await p2Page
    .getByPlaceholder(PROMPT_PLACEHOLDER)
    .fill("A pale disc above the rooftops at midnight");
  await expect(p2Page.getByText("Out of time?")).toBeVisible();
  expect((await draftSaved).ok()).toBe(true);
  await expect(
    p2Page.getByRole("button", { name: "Submit Prompt" }),
  ).toBeVisible();

  // ── Time runs out with player 2 still unsubmitted ─────────────────────────
  await hostPage
    .getByRole("button", { name: "Expire Timer (skip phase)" })
    .click();

  // ── Both images rendered: neither shows the empty placeholder ─────────────
  for (let imageNum = 1; imageNum <= 2; imageNum++) {
    await expect(hostPage.getByText(`Image ${imageNum} of 2`)).toBeVisible({
      timeout: 30_000,
    });
    await expect(hostPage.getByText("No image generated")).not.toBeVisible();

    if (imageNum < 2) {
      // Guessing → revealing → next image.
      const expireBtn = hostPage.getByRole("button", {
        name: "Expire Timer (skip phase)",
      });
      await expect(expireBtn).toBeEnabled({ timeout: 10_000 });
      await expireBtn.click();
      await expect(expireBtn).toBeEnabled({ timeout: 10_000 });
      await expireBtn.click();
    }
  }
});
