import { expect, type Page } from "@playwright/test";

export const SEED_PASSWORD = "Forge123!";

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@e2e.test`;
}

export async function login(page: Page, email: string, password = SEED_PASSWORD, callbackUrl?: string) {
  await page.goto(`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login") && !url.pathname.startsWith("/continue"));
}

export async function signup(page: Page, name: string, email: string, password = "Password123") {
  await page.goto("/signup");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/dashboard/);
}

/** Completes the test-mode checkout page (used when no Stripe keys are configured). */
export async function completeTestCheckout(page: Page) {
  await page.waitForURL(/\/dev-checkout/);
  await expect(page.getByText("Test mode")).toBeVisible();
  await page.getByRole("button", { name: "Complete test payment" }).click();
}
