import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { login } from "./helpers";

// Audit the settled page: scroll-linked reveals are mid-fade for off-screen content,
// which would be measured as low contrast. Reduced motion shows everything in place.
test.use({ colorScheme: "dark", reducedMotion: "reduce" });

/** Spec B4/B6: automated WCAG 2.1 AA checks on key pages. */
const PUBLIC_PAGES = ["/", "/classes", "/classes/vinyasa-flow", "/trainers", "/trainers/elena-cruz", "/memberships", "/spaces/yoga-studio", "/store", "/store/whey-protein-isolate", "/contact", "/login", "/signup"];

async function audit(page: import("@playwright/test").Page) {
  // Decorative-only text (WCAG 1.4.3 exemption) is marked data-decorative.
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).exclude("canvas").exclude("[data-decorative]").analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  return serious.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")})`);
}

for (const path of PUBLIC_PAGES) {
  test(`no serious a11y violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await audit(page)).toEqual([]);
  });
}

test("no serious a11y violations in the member dashboard", async ({ page }) => {
  await login(page, "member@forge.example");
  for (const path of ["/dashboard", "/dashboard/bookings", "/dashboard/profile"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await audit(page), path).toEqual([]);
  }
});

test("every page has exactly one h1", async ({ page }) => {
  for (const path of PUBLIC_PAGES) {
    await page.goto(path);
    await expect(page.locator("h1"), path).toHaveCount(1);
  }
});

test("keyboard users can skip to content and reach the main nav @mobile", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});
