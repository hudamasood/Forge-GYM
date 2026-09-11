import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("route protection (spec B5)", () => {
  test("anonymous visitors are sent to login with a return path", async ({ page }) => {
    await page.goto("/dashboard/bookings");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fdashboard%2Fbookings/);
  });

  test("members cannot open the admin or trainer portals", async ({ page }) => {
    await login(page, "member@forge.example");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/trainer");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("admin APIs reject non-admins server-side", async ({ page, request }) => {
    const anonymous = await request.get("/api/admin/members");
    expect(anonymous.status()).toBe(401);

    await login(page, "member@forge.example");
    const asMember = await page.request.get("/api/admin/members");
    expect(asMember.status()).toBe(403);
  });

  test("login returns to the requested page", async ({ page }) => {
    await login(page, "member@forge.example", undefined, "/dashboard/orders");
    await expect(page).toHaveURL(/\/dashboard\/orders$/);
  });
});
