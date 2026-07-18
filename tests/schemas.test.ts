import { describe, expect, it } from "vitest";
import { ActionItemSchema, ModelActionDraftSchema } from "@/lib/schemas";
import { actionFixture } from "./helpers";

describe("action schemas", () => {
  it("accepts an exact datetime with an explicit timezone offset", () => {
    expect(ActionItemSchema.parse(actionFixture()).dueAt).toBe("2026-07-19T10:00:00+01:00");
  });
  it("keeps a missing date null", () => {
    expect(ActionItemSchema.parse(actionFixture({ dueAt: null })).dueAt).toBeNull();
  });
  it("requires human review for an ambiguous Friday evening draft", () => {
    const draft = ModelActionDraftSchema.parse({
      title: "Call",
      action: "Call the university",
      dueAt: null,
      context: null,
      uncertainty: {
        requiresHumanReview: true,
        reasons: ["Evening has no exact time."],
        clarificationQuestion: "What time on Friday?"
      }
    });
    expect(draft.uncertainty.requiresHumanReview).toBe(true);
  });
  it("rejects a malformed model response", () => {
    expect(() => ModelActionDraftSchema.parse({ title: "Call", dueAt: "tomorrow" })).toThrow();
  });
});
