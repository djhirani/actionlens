import { ScamAssessmentSchema, type ScamAssessment } from "@/lib/schemas";

export const NO_SCAM_RISK: ScamAssessment = { scamRisk: "none", signals: [] };

export async function requestScamCheck(text: string, enabled: boolean) {
  if (!enabled) return NO_SCAM_RISK;
  const response = await fetch("/api/check-scam", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  const data: unknown = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data === "object" && data && "error" in data
        ? String(data.error)
        : "Scam risk could not be assessed."
    );
  return ScamAssessmentSchema.parse(data);
}
