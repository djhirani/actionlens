import { applyCompletionGate } from "@/lib/proof/completion-gate";
import type { ActionItem, ModelCompletionProposal, SourcePage } from "@/lib/schemas";

const timestamp = "2026-07-20T10:00:00.000Z";

export const PROOF_DEMO_ACTION: ActionItem = {
  id: "6a5c989f-702e-4d9d-942e-d321b656e45e",
  version: 1,
  title: "Upload sponsorship confirmation",
  action: "Upload sponsorship confirmation",
  dueAt: "2026-07-24T23:59:00+01:00",
  context: "Synthetic demonstration action — no real personal information",
  status: "confirmed",
  sourceText: "Please upload sponsorship confirmation by 24 July 2026.",
  uncertainty: { requiresHumanReview: false, reasons: [], clarificationQuestion: null },
  source: {
    kind: "pdf",
    displayName: "Synthetic sponsorship notice",
    sourceHash: "a".repeat(64),
    retained: false,
    extractedExcerptSaved: true
  },
  proofLink: {
    allRequiredClaimsVerified: true,
    blockedClaims: [],
    evidenceQuotes: ["Please upload sponsorship confirmation by 24 July 2026."]
  },
  completionCriteria: [
    {
      id: "sponsorship-received",
      description:
        "Confirmation explicitly names the Sponsorship Confirmation document as received",
      required: true
    }
  ],
  provenance: {
    model: "synthetic-demo",
    pipelineVersion: "stage-2-v1",
    analyzedAt: timestamp,
    timezone: "Europe/London",
    locale: "en-GB"
  },
  createdAt: timestamp,
  updatedAt: timestamp
};

export const WEAK_EVIDENCE_PAGES: SourcePage[] = [
  {
    pageNumber: 1,
    text: "Synthetic demonstration document — no real personal information\n\nFile uploaded successfully."
  }
];
export const STRONG_EVIDENCE_PAGES: SourcePage[] = [
  {
    pageNumber: 1,
    text: "Synthetic demonstration document — no real personal information\n\nWe received your Sponsorship Confirmation document on 20 July 2026. Your upload reference is DEMO-4821."
  }
];

const weakProposal: ModelCompletionProposal = {
  proposedStatus: "not_verified",
  matchedCriteria: [],
  missingCriteria: ["sponsorship-received"],
  uncertaintyReasons: ["The receipt does not identify the uploaded file."],
  explanation: "The generic upload receipt does not name sponsorship confirmation.",
  disclaimer: "The user makes the final decision."
};
const strongProposal: ModelCompletionProposal = {
  proposedStatus: "appears_complete",
  matchedCriteria: [
    {
      criterionId: "sponsorship-received",
      explanation: "The evidence explicitly confirms receipt of the named document.",
      quote: "We received your Sponsorship Confirmation document on 20 July 2026."
    }
  ],
  missingCriteria: [],
  uncertaintyReasons: [],
  explanation: "The evidence names and confirms receipt of Sponsorship Confirmation.",
  disclaimer: "The user makes the final decision."
};

export function getWeakProofResult() {
  return applyCompletionGate(PROOF_DEMO_ACTION, weakProposal, WEAK_EVIDENCE_PAGES, {
    displayName: "Synthetic generic upload receipt",
    sourceHash: "b".repeat(64)
  });
}

export function getStrongProofResult() {
  return applyCompletionGate(PROOF_DEMO_ACTION, strongProposal, STRONG_EVIDENCE_PAGES, {
    displayName: "Synthetic sponsorship confirmation email",
    sourceHash: "c".repeat(64)
  });
}
