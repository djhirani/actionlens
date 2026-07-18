import { applyClaimGate } from "@/lib/proof/claim-gate";
import type { ModelDocumentProposal, SourcePage } from "@/lib/schemas";

const pages: SourcePage[] = [
  {
    pageNumber: 1,
    text: `Synthetic demonstration document — no real personal information

Student support notice

You must upload your sponsorship confirmation through the student portal by 24 July 2026. Keep the portal receipt as confirmation that the sponsorship document was uploaded.`
  }
];

const deadline = "2026-07-24T23:59:59+01:00";
const proposal: ModelDocumentProposal = {
  documentType: "Student support notice",
  explanation:
    "The notice requires a sponsorship confirmation upload by the stated calendar deadline.",
  requiredAction: "Upload your sponsorship confirmation through the student portal.",
  deadline,
  consequence: null,
  completionCriteria: ["The portal receipt confirms that the sponsorship document was uploaded."],
  uncertainty: {
    requiresHumanReview: false,
    conflicts: [],
    clarificationQuestion: null
  },
  claims: [
    {
      kind: "required_action",
      value: "Upload your sponsorship confirmation through the student portal.",
      quote:
        "You must upload your sponsorship confirmation through the student portal by 24 July 2026."
    },
    {
      kind: "deadline",
      value: deadline,
      quote: "by 24 July 2026"
    },
    {
      kind: "completion_criterion",
      value: "The portal receipt confirms that the sponsorship document was uploaded.",
      quote: "Keep the portal receipt as confirmation that the sponsorship document was uploaded."
    }
  ]
};

export function getVerifiedFixtureResult() {
  return {
    ...applyClaimGate(proposal, pages),
    source: {
      displayName: "Synthetic sponsorship notice",
      sourceHash: "d".repeat(64),
      pages,
      retained: false as const
    },
    provenance: {
      model: "synthetic-demo",
      pipelineVersion: "stage-2-v1" as const,
      analyzedAt: "2026-07-18T00:00:00.000Z"
    }
  };
}
