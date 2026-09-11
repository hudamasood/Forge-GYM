import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("admin creates, publishes and deletes a product (audited)", async ({ page }) => {
  const slug = `e2e-bands-${Date.now()}`;
  await login(page, "admin@forge.example");
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/products/new");
  await page.getByLabel("Name").fill("E2E Mini Bands");
  await page.getByLabel("URL slug").fill(slug);
  await page.getByLabel("Category").selectOption("EQUIPMENT");
  await page.getByLabel("Price (USD)").fill("12.50");
  await page.getByLabel("Stock").fill("7");
  await page.getByLabel("Description").fill("Loop bands for warm-ups and glute activation.");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/admin\/products\?saved=1/);
  await expect(page.getByRole("link", { name: "E2E Mini Bands" })).toBeVisible();

  // Published on the storefront
  await page.goto(`/store/${slug}`);
  await expect(page.getByRole("heading", { name: "E2E Mini Bands" })).toBeVisible();
  await expect(page.getByText("$12.50").first()).toBeVisible();

  // Validation errors are shown, not swallowed
  await page.goto("/admin/products/new");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();

  // Delete, and the change appears in the audit trail
  await page.goto("/admin/products");
  await page.getByRole("button", { name: "Delete E2E Mini Bands" }).click();
  await page.getByRole("button", { name: "Delete product" }).click();
  await expect(page.getByRole("link", { name: "E2E Mini Bands" })).toHaveCount(0);
  await page.goto("/admin");
  await expect(page.getByText(/delete Product/).first()).toBeVisible();
});

test("admin schedule API rejects a trainer/space double-booking with 409", async ({ page }) => {
  await login(page, "admin@forge.example");
  const list = await page.request.get("/api/admin/schedules");
  expect(list.ok()).toBe(true);
  const { data } = (await list.json()) as { data: { classId: string; trainerId: string; spaceId: string; startTime: string; endTime: string }[] };
  expect(data.length).toBeGreaterThan(0);
  const existing = data[0];

  const clash = await page.request.post("/api/admin/schedules", {
    data: { classId: existing.classId, trainerId: existing.trainerId, spaceId: existing.spaceId, startTime: existing.startTime, endTime: existing.endTime },
  });
  expect(clash.status()).toBe(409);
  expect((await clash.json()).error.code).toBe("CONFLICT");
});
