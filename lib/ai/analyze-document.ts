import "server-only";
import { zodTextFormat } from "openai/helpers/zod";
import { getModel, getOpenAIClient } from "@/lib/ai/client";
import { applyClaimGate } from "@/lib/proof/claim-gate";
import {
  DocumentAnalysisResultSchema,
  ModelDocumentProposalSchema,
  type AnalyzeDocumentRequest
} from "@/lib/schemas";

const INSTRUCTIONS = `Analyse a text-extracted document and propose claims for one action.
Return null for any absent required action, deadline, or consequence.
Never treat an issue date, event date, office closure date, or appointment date as an action deadline.
For every non-null factual action/deadline/consequence and every completion criterion, include one claim whose value exactly equals the corresponding field and whose quote is copied exactly from the source.
Quotes are evidence proposals only. Never assign verification status.
List conflicting dates or interpretations and ask a concise clarification question.
Never invent an organisation, amount, consequence, requirement, date, or completion criterion.`;

export async function analyzeDocument(input: AnalyzeDocumentRequest) {
  const model = getModel();
  const response = await getOpenAIClient().responses.parse({
    model,
    instructions: INSTRUCTIONS,
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
