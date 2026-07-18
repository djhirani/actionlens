import type { ActionItem } from "@/lib/schemas";

export function actionFixture(overrides: Partial<ActionItem> = {}): ActionItem {
  const now = "2026-07-18T09:00:00.000Z";
  return {
    id: "3e3cb2d3-832f-4d27-b9f5-bb459c50f31a",
    version: 1,
    title: "Call the university",
    action: "Call the university about the sponsorship letter",
    dueAt: "2026-07-19T10:00:00+01:00",
    context: "Sponsorship letter",
    status: "draft",
    sourceText: "Remind me tomorrow at 10 to call the university about my sponsorship letter.",
    uncertainty: { requiresHumanReview: false, reasons: [], clarificationQuestion: null },
    provenance: {
      model: "gpt-5.6",
      pipelineVersion: "stage-1-v1",
      analyzedAt: now,
      timezone: "Europe/London",
      locale: "en-GB"
    },
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}
