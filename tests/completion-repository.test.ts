import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  actionRepository,
  completionRepository,
  getDatabase,
  resetDatabaseForTests
} from "@/lib/db";
import {
  PROOF_DEMO_ACTION,
  getStrongProofResult,
  getWeakProofResult
} from "@/lib/demo/proof-fixtures";

describe("human closure and completion persistence", () => {
  beforeEach(async () => {
    resetDatabaseForTests();
    await getDatabase().delete();
    resetDatabaseForTests();
    await actionRepository.saveConfirmed(PROOF_DEMO_ACTION);
  });
  afterEach(async () => {
    await getDatabase().delete();
    resetDatabaseForTests();
  });
  it("requires a human closure decision before changing action status", async () => {
    await completionRepository.savePending(getStrongProofResult(), false);
    expect((await actionRepository.getById(PROOF_DEMO_ACTION.id))?.status).toBe("confirmed");
  });
  it("Keep open preserves confirmed status", async () => {
    const check = await completionRepository.savePending(getStrongProofResult(), false);
    const updated = await completionRepository.decide(check.id, "keep_open");
    expect(updated.action.status).toBe("confirmed");
  });
  it("Add more evidence can preserve prior check history", async () => {
    await completionRepository.savePending(getWeakProofResult(), false);
    await completionRepository.savePending(getStrongProofResult(), false);
    expect(await completionRepository.listForAction(PROOF_DEMO_ACTION.id)).toHaveLength(2);
  });
  it("does not persist completion excerpts without explicit permission", async () => {
    const check = await completionRepository.savePending(getStrongProofResult(), false);
    expect(check.source.excerptsSaved).toBe(false);
    expect(check.matchedCriteria[0]?.evidence.quote).toBe("");
    expect(JSON.stringify(check)).not.toContain("sourcePages");
  });
  it("persists only verified excerpts when explicitly allowed", async () => {
    const check = await completionRepository.savePending(getStrongProofResult(), true);
    expect(check.source.excerptsSaved).toBe(true);
    expect(check.matchedCriteria[0]?.evidence.quote).toContain("Sponsorship Confirmation");
    expect(JSON.stringify(check)).not.toContain("sourcePages");
  });
  it("never persists near-match excerpts", async () => {
    const result = getStrongProofResult();
    result.matchedCriteria[0]!.evidence.verificationStatus = "near_match_review";
    const check = await completionRepository.savePending(result, true);
    expect(check.matchedCriteria[0]?.evidence.quote).toBe("");
  });
});
