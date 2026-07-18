import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home and Evidence Bridge have no detectable accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();

  await page.getByRole("button", { name: "Try a source-verified action" }).click();
  await expect(page.getByRole("heading", { name: "Synthetic sponsorship notice" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("Proof of Done remains accessible at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/proof-demo");
  await page.getByRole("button", { name: "Try weak evidence" }).click();
  await expect(page.getByRole("heading", { name: "Not verified" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
