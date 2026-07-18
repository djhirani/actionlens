import { chromium } from "playwright";

function getBaseURL() {
  const value = process.env.SMOKE_BASE_URL;
  if (!value || !URL.canParse(value)) throw new Error("smoke:live requires a valid SMOKE_BASE_URL");
  return value;
}

const baseURL = getBaseURL();

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (let run = 1; run <= 3; run += 1) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(baseURL, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Reset demo data" }).click();
      await page.getByRole("button", { name: "Try the “No deadline stated” demo" }).click();
      await page.getByRole("heading", { name: "No required action found" }).waitFor();
      await page.getByText("No reminder created.").waitFor();

      await page.getByRole("button", { name: "Try a source-verified action" }).click();
      await page.getByText("✓ Source verified").waitFor();
      await page.getByRole("button", { name: "Confirm Proof-Linked Action" }).click();
      await page.getByText("Proof-Linked Action confirmed and saved locally.").waitFor();

      await page.goto(new URL("/proof-demo", baseURL).href, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Try weak evidence" }).click();
      await page.getByRole("heading", { name: "Not verified" }).waitFor();
      if (await page.getByRole("button", { name: "Mark complete" }).isEnabled())
        throw new Error(`Smoke run ${run}: weak evidence enabled Mark complete`);

      await page.getByRole("button", { name: "Try strong evidence" }).click();
      await page.getByRole("heading", { name: "Appears complete" }).waitFor();
      await page.getByRole("button", { name: "Mark complete" }).click();
      await page.getByText("Action status: completed").waitFor();

      await page.goto(new URL("/inbox", baseURL).href, { waitUntil: "networkidle" });
      await page.getByRole("tab", { name: /Completed/ }).click();
      await page.getByRole("heading", { name: "Upload sponsorship confirmation" }).waitFor();
      process.stdout.write(`Production smoke run ${run}: PASS\n`);
      await context.close();
    }

    const response = await fetch(new URL("/api/interpret-text", baseURL), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    });
    const payload = (await response.json()) as { error?: string };
    if (response.status !== 400 || payload.error !== "Check the instruction and time details.")
      throw new Error("Production API validation smoke check failed");
    process.stdout.write("Production API sanitisation: PASS\n");
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `Production smoke failed: ${error instanceof Error ? error.message : "Unknown error"}\n`
  );
  process.exitCode = 1;
});
