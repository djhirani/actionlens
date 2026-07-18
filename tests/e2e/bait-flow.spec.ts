import { expect, test } from "@playwright/test";

test("the no-deadline bait refuses the office closure date", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the “No deadline stated” demo" }).click();
  await expect(page.getByRole("heading", { name: "No required action found" })).toBeVisible();
  await expect(page.getByText("No stated deadline found")).toBeVisible();
  await expect(page.getByText("No reminder created.")).toBeVisible();
  await expect(
    page.getByText(/office will close for staff training on 30 July 2026/)
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm Proof-Linked Action" })).toBeDisabled();
});
