import { applyClaimGate } from "@/lib/proof/claim-gate";
import type { ModelDocumentProposal, SourcePage } from "@/lib/schemas";

export const BAIT_PAGES: SourcePage[] = [
  {
    pageNumber: 1,
    text: `Synthetic demonstration document — no real personal information

Contact details notice

Our administration office will close for staff training on 30 July 2026. You may update your contact details at your convenience using the contact form. No response is required by a particular date.`
  }
];

export const BAIT_PROPOSAL: ModelDocumentProposal = {
  documentType: "Contact details notice",
  explanation:
    "The notice offers an optional contact-details update but states no action deadline.",
  requiredAction: null,
  deadline: null,
  consequence: null,
  completionCriteria: [],
  uncertainty: {
    requiresHumanReview: false,
    conflicts: [],
    clarificationQuestion: null
  },
  claims: []
};

export function getBaitFixtureResult() {
  return {
    ...applyClaimGate(BAIT_PROPOSAL, BAIT_PAGES),
    source: {
      displayName: "Synthetic no-deadline notice",
      sourceHash: "demo-not-persisted",
      pages: BAIT_PAGES,
      retained: false as const
    },
    provenance: {
      model: "synthetic-demo",
      pipelineVersion: "stage-2-v1" as const,
      analyzedAt: "2026-07-18T00:00:00.000Z"
    }
  };
}
