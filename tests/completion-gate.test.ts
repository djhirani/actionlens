import { describe, expect, it } from "vitest";
import {
  PROOF_DEMO_ACTION,
  STRONG_EVIDENCE_PAGES,
  WEAK_EVIDENCE_PAGES,
  getWeakProofResult
} from "@/lib/demo/proof-fixtures";
import { applyCompletionGate, COMPLETION_DISCLAIMER } from "@/lib/proof/completion-gate";
import type { ModelCompletionProposal } from "@/lib/schemas";

const source = { displayName: "evidence.txt", sourceHash: "d".repeat(64) };
const strongProposal: ModelCompletionProposal = {
  proposedStatus: "appears_complete",
  matchedCriteria: [
    {
      criterionId: "sponsorship-received",
      explanation: "Named receipt.",
      quote: "We received your Sponsorship Confirmation document on 20 July 2026."
    }
  ],
  missingCriteria: [],
  uncertaintyReasons: [],
  explanation: "Named confirmation received.",
  disclaimer: "model disclaimer"
};

describe("deterministic completion gate", () => {
  it("returns appears complete only when all criteria and quotes are verified", () => {
    const result = applyCompletionGate(
      PROOF_DEMO_ACTION,
      strongProposal,
      STRONG_EVIDENCE_PAGES,
      source
    );
    expect(result.status).toBe("appears_complete");
    expect(result.disclaimer).toBe(COMPLETION_DISCLAIMER);
  });
  it("sends a partial near match to human review", () => {
    const proposal = {
      ...strongProposal,
      matchedCriteria: [
        {
          ...strongProposal.matchedCriteria[0]!,
          quote: "We received the Sponsorship Confirmation document on 20 July 2026."
        }
      ]
    };
    expect(
      applyCompletionGate(PROOF_DEMO_ACTION, proposal, STRONG_EVIDENCE_PAGES, source).status
    ).toBe("needs_human_review");
  });
  it("rejects a generic upload receipt", () => {
    expect(getWeakProofResult().status).toBe("not_verified");
  });
  it("does not appear complete with an unsupported evidence quote", () => {
    const proposal = {
      ...strongProposal,
      matchedCriteria: [
        {
          ...strongProposal.matchedCriteria[0]!,
          quote: "Sponsorship document officially accepted."
        }
      ]
    };
    expect(
      applyCompletionGate(PROOF_DEMO_ACTION, proposal, STRONG_EVIDENCE_PAGES, source).status
    ).not.toBe("appears_complete");
  });
  it("returns not verified when a required criterion is missing", () => {
    const proposal = {
      ...strongProposal,
      matchedCriteria: [],
      missingCriteria: ["sponsorship-received"]
    };
    expect(
      applyCompletionGate(PROOF_DEMO_ACTION, proposal, WEAK_EVIDENCE_PAGES, source).status
    ).toBe("not_verified");
  });
});
