import type { Page } from "@playwright/test";

/**
 * Navigate to the home page and create a guest session as the test host.
 */
export async function signInAsHost(page: Page): Promise<void> {
  await page.goto("/");
  await setGuestSession(page, process.env.TEST_HOST_USERNAME ?? "TestHost");
}

/**
 * Navigate to the home page and create a guest session as the second test player.
 */
export async function signInAsPlayer2(page: Page): Promise<void> {
  await page.goto("/");
  await setGuestSession(page, process.env.TEST_PLAYER2_USERNAME ?? "TestPlayer2");
}

/**
 * POST to /api/auth/guest to create a session for the given username.
 * Uses page.evaluate so the cookie is set in the browser context automatically.
 */
async function setGuestSession(page: Page, username: string): Promise<void> {
  await page.evaluate(async (name: string) => {
    const res = await fetch("/api/auth/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: name }),
    });
    if (!res.ok) throw new Error(`Guest auth failed: ${res.status}`);
  }, username);
  // Reload so the page reflects the new session
  await page.reload();
  // Wait for useSession to resolve — username appears in the nav once the
  // /api/auth/me fetch completes. Without this, clicking buttons immediately
  // after reload can race: user is still null and the UsernameModal appears.
  await page.getByText(username, { exact: true }).waitFor({ timeout: 5_000 });
}
