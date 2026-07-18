import { matchEvidence, type EvidenceMatch } from "@/lib/documents/evidence-match";
import type { ModelDocumentProposal, SourcePage } from "@/lib/schemas";

export type VerifiedClaim = EvidenceMatch & {
  kind: "required_action" | "deadline" | "consequence" | "completion_criterion";
  value: string;
};

export type ProofLinkedResult = {
  documentType: string;
  explanation: string;
  requiredAction: string | null;
  deadline: string | null;
  consequence: string | null;
  completionCriteria: string[];
  evidence: VerifiedClaim[];
  blockedClaims: string[];
  conflicts: string[];
  clarificationQuestion: string | null;
  requiresHumanReview: boolean;
  allRequiredClaimsVerified: boolean;
  canConfirm: boolean;
};

function findClaim(proposal: ModelDocumentProposal, kind: VerifiedClaim["kind"], value: string) {
  return proposal.claims.find((claim) => claim.kind === kind && claim.value === value);
}

export function applyClaimGate(
  proposal: ModelDocumentProposal,
  pages: SourcePage[]
): ProofLinkedResult {
  const blockedClaims: string[] = [];
  const evidence: VerifiedClaim[] = [];

  const verify = (kind: VerifiedClaim["kind"], value: string) => {
    const claim = findClaim(proposal, kind, value);
    const match = claim
      ? matchEvidence(pages, claim.quote)
      : {
          quote: "",
          normalizedQuote: "",
          page: null,
          charStart: null,
          charEnd: null,
          verificationStatus: "unsupported" as const,
          verificationReason: "The model supplied no evidence quote for this claim."
        };
    evidence.push({ ...match, kind, value });
    if (match.verificationStatus !== "verified") blockedClaims.push(`${kind}: ${value}`);
    return match.verificationStatus === "verified";
  };

  const actionVerified = proposal.requiredAction
    ? verify("required_action", proposal.requiredAction)
    : false;
  const deadlineVerified = proposal.deadline ? verify("deadline", proposal.deadline) : true;
  const consequenceVerified = proposal.consequence
    ? verify("consequence", proposal.consequence)
    : true;
  for (const criterion of proposal.completionCriteria) verify("completion_criterion", criterion);

  const deadline = proposal.deadline && deadlineVerified ? proposal.deadline : null;
  const conflicts = proposal.uncertainty.conflicts;
  const allRequiredClaimsVerified =
    Boolean(proposal.requiredAction) &&
    proposal.completionCriteria.length > 0 &&
    evidence.every((item) => item.verificationStatus === "verified");
  const requiresHumanReview =
    proposal.uncertainty.requiresHumanReview ||
    conflicts.length > 0 ||
    evidence.some((item) => item.verificationStatus !== "verified");
  return {
    documentType: proposal.documentType,
    explanation: proposal.explanation,
    requiredAction: actionVerified ? proposal.requiredAction : null,
    deadline,
    consequence: proposal.consequence && consequenceVerified ? proposal.consequence : null,
    completionCriteria: proposal.completionCriteria,
    evidence,
    blockedClaims,
    conflicts,
    clarificationQuestion: proposal.uncertainty.clarificationQuestion,
    requiresHumanReview,
    allRequiredClaimsVerified,
    canConfirm: allRequiredClaimsVerified && !requiresHumanReview
  };
}
