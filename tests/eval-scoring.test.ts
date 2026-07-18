import { describe, expect, it } from "vitest";
import { calculateMetrics, scoreFixture, type EvalExpectation } from "@/lib/evals/scoring";

const expected: EvalExpectation = {
  fixtureId: "fixture-test",
  kind: "document",
  expectedActionPresent: true,
  expectedActionKeywords: ["upload", "sponsorship"],
  expectedDeadlineDate: null,
  forbiddenDeadlineValues: ["2026-07-30"],
  expectedExactEvidence: true,
  expectedHumanReview: false,
  expectedCompletionStatus: null,
  notes: "test"
};

describe("evaluation scoring", () => {
  it("scores human-labelled fields and exposes failures", () => {
    const score = scoreFixture(expected, {
      action: "Upload sponsorship confirmation",
      deadline: "2026-07-30T17:00:00+01:00",
      exactEvidence: true,
      humanReview: false,
      completionStatus: null,
      unsupportedClaimCount: 1
    });
    expect(score.passed).toBe(false);
    expect(score.deadlineCorrect).toBe(false);
    expect(score.inventedClaimCount).toBe(1);
    expect(score.failures).toContain("a forbidden contextual date was used as the deadline");
  });

  it("reports counts and percentages with explicit denominators", () => {
    const actual = {
      action: "Upload sponsorship confirmation",
      deadline: null,
      exactEvidence: true,
      humanReview: false,
      completionStatus: null,
      unsupportedClaimCount: 0
    } as const;
    const score = scoreFixture(expected, actual);
    const metrics = calculateMetrics([{ expected, actual, score }]);
    expect(metrics.actionPrecision).toEqual({ correct: 1, total: 1, percent: 100 });
    expect(metrics.unsupportedDeadlineRefusal).toEqual({ correct: 1, total: 1, percent: 100 });
    expect(metrics.inventedFactualClaimCount).toBe(0);
  });
});
