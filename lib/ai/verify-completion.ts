import "server-only";
import { zodTextFormat } from "openai/helpers/zod";
import { getModel, getOpenAIClient } from "@/lib/ai/client";
import { applyCompletionGate } from "@/lib/proof/completion-gate";
import { ModelCompletionProposalSchema, type VerifyCompletionRequest } from "@/lib/schemas";

const INSTRUCTIONS = `Compare completion evidence with every explicit completion criterion.
Return an evidence quote copied exactly from the completion source for each proposed match.
A generic upload receipt does not match a criterion that names a specific required document.
List the criterion ID in missingCriteria when the evidence does not support it.
Do not claim official acceptance, compliance, approval, or guaranteed completion.
The proposed status is advisory only; application code will recompute it.
Use the required disclaimer supplied in the input. Never make the user's closure decision.`;

export async function verifyCompletion(input: VerifyCompletionRequest) {
  const response = await getOpenAIClient().responses.parse({
    model: getModel(),
    instructions: INSTRUCTIONS,
    input: JSON.stringify({
      action: input.action.action,
      completionCriteria: input.action.completionCriteria,
      originalVerifiedQuotes: input.action.proofLink?.evidenceQuotes ?? [],
      completionEvidencePages: input.pages,
      timeContext: input.timeContext,
      requiredDisclaimer:
        "ActionLens checks whether the submitted evidence appears to match the requirement. It cannot confirm official acceptance."
    }),
    text: { format: zodTextFormat(ModelCompletionProposalSchema, "completion_check") }
  });
  const proposal = ModelCompletionProposalSchema.parse(response.output_parsed);
  return applyCompletionGate(input.action, proposal, input.pages, {
    displayName: input.displayName,
    sourceHash: input.sourceHash
  });
}
