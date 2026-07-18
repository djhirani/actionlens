import "server-only";
import { zodTextFormat } from "openai/helpers/zod";
import { getModel, getOpenAIClient } from "@/lib/ai/client";
import { COMPLETION_VERIFICATION_INSTRUCTIONS } from "@/lib/ai/instructions";
import { applyCompletionGate } from "@/lib/proof/completion-gate";
import { ModelCompletionProposalSchema, type VerifyCompletionRequest } from "@/lib/schemas";

export async function verifyCompletion(input: VerifyCompletionRequest) {
  const response = await getOpenAIClient().responses.parse({
    model: getModel(),
    instructions: COMPLETION_VERIFICATION_INSTRUCTIONS,
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
