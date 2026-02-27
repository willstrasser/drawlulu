import { clerk } from "@clerk/testing/playwright";
import type { Page } from "@playwright/test";

/**
 * Navigate to the home page and sign in as the test host user.
 *
 * Uses the email-based ticket strategy: Clerk's Backend SDK creates a
 * one-time sign-in token for the user (identified by email) and injects
 * it into the page without an OTP prompt.  The user must exist in the
 * Clerk test instance.
 *
 * Calling page.goto('/') inside the helper means the test can immediately
 * interact with the home page after awaiting this function.
 */
export async function signInAsHost(page: Page): Promise<void> {
  await page.goto("/");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "email_code",
      identifier: process.env.TEST_HOST_EMAIL!,
    },
  });
}

/**
 * Navigate to the home page and sign in as the second test player.
 */
export async function signInAsPlayer2(page: Page): Promise<void> {
  await page.goto("/");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "email_code",
      identifier: process.env.TEST_PLAYER2_EMAIL!,
    },
  });
}
