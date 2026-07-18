import "server-only";
import { zodTextFormat } from "openai/helpers/zod";
import { getModel, getOpenAIClient } from "@/lib/ai/client";
import { DOCUMENT_ANALYSIS_INSTRUCTIONS } from "@/lib/ai/instructions";
import { applyClaimGate } from "@/lib/proof/claim-gate";
import {
  DocumentAnalysisResultSchema,
  ModelDocumentProposalSchema,
  type AnalyzeDocumentRequest
} from "@/lib/schemas";

export async function analyzeDocument(input: AnalyzeDocumentRequest) {
  const model = getModel();
  const response = await getOpenAIClient().responses.parse({
    model,
    instructions: DOCUMENT_ANALYSIS_INSTRUCTIONS,
    input: JSON.stringify({ pages: input.pages, timeContext: input.timeContext }),
    text: { format: zodTextFormat(ModelDocumentProposalSchema, "document_action") }
  });
  const proposal = ModelDocumentProposalSchema.parse(response.output_parsed);
  return DocumentAnalysisResultSchema.parse({
    ...applyClaimGate(proposal, input.pages),
    source: {
      displayName: input.displayName,
      sourceHash: input.sourceHash,
      pages: input.pages,
      retained: false as const
    },
    provenance: {
      model,
      pipelineVersion: "stage-2-v1" as const,
      analyzedAt: new Date().toISOString()
    }
  });
}
