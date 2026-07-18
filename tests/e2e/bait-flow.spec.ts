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

test("weak proof is rejected and history is preserved for more evidence", async ({ page }) => {
  await page.goto("/proof-demo");
  await page.getByRole("button", { name: "Try weak evidence" }).click();
  await expect(page.getByRole("heading", { name: "Not verified" })).toBeVisible();
  await expect(page.getByText(/cannot confirm official acceptance/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark complete" })).toBeDisabled();
  await page.getByRole("button", { name: "Add more evidence" }).click();
  await expect(page.getByRole("heading", { name: "Completion history" })).toBeVisible();
  await expect(page.getByText(/Not verified · pending/)).toBeVisible();
});

test("strong proof appears complete but waits for human closure", async ({ page }) => {
  await page.goto("/proof-demo");
  await page.getByRole("button", { name: "Try strong evidence" }).click();
  await expect(page.getByRole("heading", { name: "Appears complete" })).toBeVisible();
  await expect(page.getByText("Action status: confirmed")).toBeVisible();
  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(page.getByRole("status")).toContainText("Marked complete");
  await expect(page.getByText("Action status: completed")).toBeVisible();
});
