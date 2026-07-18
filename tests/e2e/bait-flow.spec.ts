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
  await page.goto("/inbox");
  await page.getByRole("tab", { name: /Completed/ }).click();
  await expect(
    page.getByRole("heading", { name: "Upload sponsorship confirmation" })
  ).toBeVisible();
  await expect(page.getByText("Completed by you")).toBeVisible();
  await page.getByRole("link", { name: "Open action" }).click();
  await page.getByRole("button", { name: "Delete action" }).click();
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page).toHaveURL(/\/inbox$/);
  await page.getByRole("tab", { name: /Completed/ }).click();
  await expect(page.getByRole("heading", { name: "No completed actions" })).toBeVisible();
});

test("the complete built-in judge path is repeatable three times", async ({ page }) => {
  test.setTimeout(90_000);
  for (let run = 1; run <= 3; run += 1) {
    await page.goto("/");
    await page.getByRole("button", { name: "Reset demo data" }).click();
    await expect(page.getByRole("status")).toContainText("Synthetic demo action");

    await page.getByRole("button", { name: "Try the “No deadline stated” demo" }).click();
    await expect(page.getByRole("heading", { name: "No required action found" })).toBeVisible();
    await expect(page.getByText("No reminder created.")).toBeVisible();

    await page.getByRole("button", { name: "Try a source-verified action" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Upload your sponsorship confirmation through the student portal."
      })
    ).toBeVisible();
    await expect(page.getByText("✓ Source verified")).toBeVisible();
    await page.getByRole("button", { name: "Confirm Proof-Linked Action" }).click();
    await expect(page.getByText("Proof-Linked Action confirmed and saved locally.")).toBeVisible();

    await page.goto("/proof-demo");
    await page.getByRole("button", { name: "Try weak evidence" }).click();
    await expect(page.getByRole("heading", { name: "Not verified" })).toBeVisible();
    await page.getByRole("button", { name: "Try strong evidence" }).click();
    await expect(page.getByRole("heading", { name: "Appears complete" })).toBeVisible();
    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByRole("status")).toContainText("Marked complete");

    await page.goto("/inbox");
    await page.getByRole("tab", { name: /Completed/ }).click();
    await expect(
      page.getByRole("heading", { name: "Upload sponsorship confirmation" })
    ).toBeVisible();
  }
});
