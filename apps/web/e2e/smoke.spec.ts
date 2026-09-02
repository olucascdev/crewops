import { expect, test } from "@playwright/test";

// Smoke: the web shell renders with the operation header and navigation rail.
// This validates the foundation PWA boots; domain flows are validated by later
// vertical slices and their own E2E suites.
test("home renders the operation shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Operação");
  await expect(page.locator(".sidebar")).toBeVisible();
  await expect(page.locator(".gpsNotice")).toContainText("GPS por evento");
});
