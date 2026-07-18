import { describe, expect, it } from "vitest";
import { BAIT_PAGES, BAIT_PROPOSAL } from "@/lib/demo/bait-fixture";
import { applyClaimGate } from "@/lib/proof/claim-gate";
import type { ModelDocumentProposal, SourcePage } from "@/lib/schemas";

const pages: SourcePage[] = [
  { pageNumber: 1, text: "Please upload sponsorship confirmation by 24 July 2026." }
];
const base: ModelDocumentProposal = {
  documentType: "University notice",
  explanation: "Sponsorship evidence is required.",
  requiredAction: "Upload sponsorship confirmation",
  deadline: "2026-07-24T23:59:00+01:00",
  consequence: null,
  completionCriteria: [],
  uncertainty: { requiresHumanReview: false, conflicts: [], clarificationQuestion: null },
  claims: [
    {
      kind: "required_action",
      value: "Upload sponsorship confirmation",
      quote: "Please upload sponsorship confirmation by 24 July 2026."
    },
    { kind: "deadline", value: "2026-07-24T23:59:00+01:00", quote: "by 24 July 2026" }
  ]
};

describe("claim gate", () => {
  it("removes an unsupported deadline", () => {
    const proposal = {
      ...base,
      claims: base.claims.map((claim) =>
        claim.kind === "deadline" ? { ...claim, quote: "Submit by 30 July" } : claim
      )
    };
    const result = applyClaimGate(proposal, pages);
    expect(result.deadline).toBeNull();
    expect(result.blockedClaims.some((claim) => claim.startsWith("deadline"))).toBe(true);
  });
  it("prevents confirmation when the required action is unsupported", () => {
    const proposal = {
      ...base,
      claims: base.claims.filter((claim) => claim.kind !== "required_action")
    };
    const result = applyClaimGate(proposal, pages);
    expect(result.requiredAction).toBeNull();
    expect(result.canConfirm).toBe(false);
  });
  it("keeps conflicting dates in human review", () => {
    const proposal = {
      ...base,
      uncertainty: {
        requiresHumanReview: true,
        conflicts: ["Form due 22 July; appointment 24 July."],
        clarificationQuestion: "Which action should be created?"
      }
    };
    const result = applyClaimGate(proposal, pages);
    expect(result.requiresHumanReview).toBe(true);
    expect(result.canConfirm).toBe(false);
  });
  it("keeps the bait fixture deadline null", () => {
    const result = applyClaimGate(BAIT_PROPOSAL, BAIT_PAGES);
    expect(result.deadline).toBeNull();
    expect(JSON.stringify(result)).not.toContain("2026-07-30T");
  });
});
