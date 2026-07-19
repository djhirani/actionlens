import { normalizeText } from "@/lib/documents/normalize";
import type { z } from "zod";
import { ModelScamAssessmentSchema, ScamAssessmentSchema } from "@/lib/schemas";

type ModelAssessment = z.infer<typeof ModelScamAssessmentSchema>;

export function verifyScamAssessment(text: string, assessment: ModelAssessment) {
  const normalizedSource = normalizeText(text);
  return ScamAssessmentSchema.parse({
    scamRisk: assessment.scamRisk,
    signals: assessment.signals
      .filter((signal) => !signal.isQuote || normalizedSource.includes(normalizeText(signal.text)))
      .map((signal) => signal.text)
  });
}
