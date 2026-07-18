import { matchEvidence } from "@/lib/documents/evidence-match";
import {
  CompletionAnalysisResultSchema,
  type ActionItem,
  type ModelCompletionProposal,
  type SourcePage
} from "@/lib/schemas";

export const COMPLETION_DISCLAIMER =
  "ActionLens checks whether the submitted evidence appears to match the requirement. It cannot confirm official acceptance.";

export function applyCompletionGate(
  action: ActionItem,
  proposal: ModelCompletionProposal,
  pages: SourcePage[],
  source: { displayName: string; sourceHash: string }
) {
  const criterionIds = new Set(action.completionCriteria.map((criterion) => criterion.id));
  const requiredIds = new Set(
    action.completionCriteria
      .filter((criterion) => criterion.required)
      .map((criterion) => criterion.id)
  );
  const matchedCriteria = proposal.matchedCriteria
    .filter((match) => criterionIds.has(match.criterionId))
    .map((match) => ({
      criterionId: match.criterionId,
      explanation: match.explanation,
      evidence: matchEvidence(pages, match.quote)
    }));
  const verifiedIds = new Set(
    matchedCriteria
      .filter((match) => match.evidence.verificationStatus === "verified")
      .map((match) => match.criterionId)
  );
  const explicitMissing = proposal.missingCriteria.filter((id) => requiredIds.has(id));
  const absentRequired = [...requiredIds].filter(
    (id) => !proposal.matchedCriteria.some((match) => match.criterionId === id)
  );
  const missingCriteria = [...new Set([...explicitMissing, ...absentRequired])];
  const hasUnsupported = matchedCriteria.some(
    (match) => match.evidence.verificationStatus === "unsupported"
  );
  const hasNearMatch = matchedCriteria.some(
    (match) => match.evidence.verificationStatus === "near_match_review"
  );
  const allRequiredVerified = [...requiredIds].every((id) => verifiedIds.has(id));

  let status: "appears_complete" | "needs_human_review" | "not_verified";
  if (missingCriteria.length || hasUnsupported || !matchedCriteria.length) status = "not_verified";
  else if (!allRequiredVerified || hasNearMatch || proposal.uncertaintyReasons.length)
    status = "needs_human_review";
  else status = "appears_complete";

  return CompletionAnalysisResultSchema.parse({
    id: crypto.randomUUID(),
    actionId: action.id,
    status,
    matchedCriteria,
    missingCriteria,
    uncertaintyReasons: proposal.uncertaintyReasons,
    explanation: proposal.explanation,
    disclaimer: COMPLETION_DISCLAIMER,
    source: {
      displayName: source.displayName,
      sourceHash: source.sourceHash,
      retained: false,
      excerptsSaved: false
    },
    sourcePages: pages,
    userDecision: "pending",
    createdAt: new Date().toISOString()
  });
}
