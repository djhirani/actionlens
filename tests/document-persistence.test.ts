import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { actionRepository, getDatabase, resetDatabaseForTests } from "@/lib/db";
import { actionFixture } from "./helpers";

describe("document persistence privacy", () => {
  beforeEach(async () => {
    resetDatabaseForTests();
    await getDatabase().delete();
    resetDatabaseForTests();
  });
  afterEach(async () => {
    await getDatabase().delete();
    resetDatabaseForTests();
  });
  it("stores provenance and excerpts but never the original source file", async () => {
    await actionRepository.saveConfirmed(
      actionFixture({
        sourceText: "Please upload sponsorship confirmation.",
        source: {
          kind: "pdf",
          displayName: "notice.pdf",
          sourceHash: "a".repeat(64),
          retained: false,
          extractedExcerptSaved: true
        },
        proofLink: {
          allRequiredClaimsVerified: true,
          blockedClaims: [],
          evidenceQuotes: ["Please upload sponsorship confirmation."]
        },
        provenance: {
          model: "gpt-5.6",
          pipelineVersion: "stage-2-v1",
          analyzedAt: "2026-07-18T09:00:00.000Z",
          timezone: "Europe/London",
          locale: "en-GB"
        }
      })
    );
    const stored = (await actionRepository.listConfirmed())[0];
    expect(stored?.source?.retained).toBe(false);
    expect(JSON.stringify(stored)).not.toContain("arrayBuffer");
    expect(JSON.stringify(stored)).not.toContain("blob:");
  });
});
