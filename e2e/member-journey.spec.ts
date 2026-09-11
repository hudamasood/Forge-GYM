import { expect, test } from "@playwright/test";
import { completeTestCheckout, signup, uniqueEmail } from "./helpers";

/**
 * Spec B6 critical paths:
 *  - sign up → select a plan → checkout → membership active
 *  - book a class → see it on the dashboard; blocked outside the plan
 */
test("member joins, buys a plan, books a class and sees it on the dashboard", async ({ page }) => {
  await signup(page, "E2E Member", uniqueEmail("member"));
  await expect(page.getByRole("heading", { name: /hey, e2e/i })).toBeVisible();

  // Buy Yoga Unlimited (monthly)
  await page.goto("/memberships");
  await page.getByRole("button", { name: "Join Yoga Unlimited, billed monthly" }).click();
  await completeTestCheckout(page);
  await page.waitForURL(/\/dashboard\/membership/);
  await expect(page.getByRole("heading", { name: "Yoga Unlimited" })).toBeVisible();
  await expect(page.getByText("Active").first()).toBeVisible();

  // Blocked from a Gym Floor class
  await page.goto("/classes/forge-strength");
  await page.getByRole("button", { name: /^Book Forge Strength/ }).first().click();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByRole("dialog")).toContainText("does not cover");
  await page.keyboard.press("Escape");

  // Book a Yoga class
  await page.goto("/classes/vinyasa-flow");
  await page.getByRole("button", { name: /^Book Vinyasa Flow/ }).first().click();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByRole("dialog")).toContainText("Confirmed");

  // Visible on the dashboard, then cancel it
  await page.goto("/dashboard/bookings");
  await expect(page.getByRole("link", { name: "Vinyasa Flow" })).toBeVisible();
  await page.getByRole("button", { name: /^Cancel Vinyasa Flow/ }).first().click();
  await page.getByRole("button", { name: "Cancel booking" }).click();
  await expect(page.getByText("Nothing booked")).toBeVisible();
});

test("store: add to cart → checkout → order appears in history", async ({ page }) => {
  await signup(page, "E2E Shopper", uniqueEmail("shopper"));

  await page.goto("/store/creatine-monohydrate");
  await page.getByRole("button", { name: "Add Creatine Monohydrate to cart" }).click();
  await expect(page.getByRole("link", { name: /Cart, 1 item/ })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByText("$29.99").first()).toBeVisible();
  await page.getByRole("link", { name: "Checkout" }).click();
  await page.waitForURL(/\/checkout$/);
  await page.getByRole("button", { name: /Pay securely/ }).click();
  await completeTestCheckout(page);

  await page.waitForURL(/\/checkout\/success/);
  await expect(page.getByRole("heading", { name: "Order received" })).toBeVisible();
  await page.goto("/dashboard/orders");
  await expect(page.getByText("1 × Creatine Monohydrate")).toBeVisible();
  await expect(page.getByText("Paid")).toBeVisible();
});
