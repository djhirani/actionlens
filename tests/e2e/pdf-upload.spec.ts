import path from "node:path";
import { expect, test } from "@playwright/test";

const fixtures = [
  {
    name: "03_hospital_letter_conflicting_dates.pdf",
    expectedText: "Submit the online eligibility form by 22 July 2026"
  },
  {
    name: "05_tenancy_letter_hallucination_bait.pdf",
    expectedText: "The letter does not state a deadline"
  }
];

for (const fixture of fixtures) {
  test(`${fixture.name} extracts locally and reaches document analysis`, async ({ page }) => {
    let requestBody: { displayName?: string; pages?: Array<{ text?: string }> } | undefined;
    await page.route("**/api/analyze-document", async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Synthetic analysis stop after local extraction." })
      });
    });

    await page.goto("/");
    await page
      .getByLabel("Text-based PDF")
      .setInputFiles(path.join(process.cwd(), "tests", "fixtures", fixture.name));
    await page.getByRole("button", { name: "Analyse document" }).click();

    await expect(page.locator("p.error[role='alert']")).toHaveText(
      "Synthetic analysis stop after local extraction."
    );
    expect(requestBody?.displayName).toBe(fixture.name);
    expect(requestBody?.pages).toHaveLength(1);
    expect(requestBody?.pages?.[0]?.text?.replace(/\s+/g, " ")).toContain(fixture.expectedText);
    await expect(page.getByText(`Selected: ${fixture.name}`)).toBeVisible();
    await expect(page.getByLabel("Text-based PDF")).toHaveValue(new RegExp(`${fixture.name}$`));
  });
}
