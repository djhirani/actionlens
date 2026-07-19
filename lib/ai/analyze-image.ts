import "server-only";
import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIClient } from "@/lib/ai/client";
import { verifyImageEvidenceQuotes } from "@/lib/images/verify-quotes";
import {
  ActionItemSchema,
  ImageAnalysisResultSchema,
  ModelImageAnalysisSchema,
  type AnalyzeImageRequest
} from "@/lib/schemas";

const IMAGE_MODEL = "gpt-5.6";
const INSTRUCTIONS = `Transcribe this single photograph of a letter faithfully, then propose one Action Card.
Never infer a deadline or factual claim that is not explicitly present in the transcription.
Every evidence quote must be copied verbatim from the transcription and must support the action, deadline (when present), and each completion criterion.
Set readConfidence to low whenever blur, occlusion, handwriting, rotation, or image quality makes the relevant text unreliable.`;

export async function analyzeImage(input: AnalyzeImageRequest) {
  const response = await getOpenAIClient().responses.parse({
    model: IMAGE_MODEL,
    instructions: INSTRUCTIONS,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: JSON.stringify({ timeContext: input.timeContext }) },
          { type: "input_image", image_url: input.imageDataUrl, detail: "high" }
        ]
      }
    ],
    text: { format: zodTextFormat(ModelImageAnalysisSchema, "photo_action") }
  });
  const proposal = ModelImageAnalysisSchema.parse(response.output_parsed);
  if (proposal.readConfidence === "low")
    return ImageAnalysisResultSchema.parse({ ...proposal, card: null, rejectionReason: null });

  if (!verifyImageEvidenceQuotes(proposal.transcription, proposal.card.evidenceQuotes)) {
    return ImageAnalysisResultSchema.parse({
      transcription: proposal.transcription,
      readConfidence: proposal.readConfidence,
      card: null,
      rejectionReason: "No supporting source found."
    });
  }

  const now = new Date().toISOString();
  const card = ActionItemSchema.parse({
    ...proposal.card,
    id: crypto.randomUUID(),
    version: 1,
    status: "draft",
    sourceText: proposal.card.evidenceQuotes.join("\n").slice(0, 2000),
    source: {
      kind: "image",
      displayName: input.displayName,
      sourceHash: input.sourceHash,
      retained: false,
      extractedExcerptSaved: true
    },
    proofLink: {
      allRequiredClaimsVerified: true,
      blockedClaims: [],
      evidenceQuotes: proposal.card.evidenceQuotes
    },
    completionCriteria: proposal.card.completionCriteria.map((description, index) => ({
      id: `criterion-${index + 1}`,
      description,
      required: true
    })),
    provenance: {
      model: IMAGE_MODEL,
      pipelineVersion: "stage-2-v1",
      analyzedAt: now,
      timezone: input.timeContext.timezone,
      locale: input.timeContext.locale
    },
    createdAt: now,
    updatedAt: now
  });
  return ImageAnalysisResultSchema.parse({ ...proposal, card, rejectionReason: null });
}
