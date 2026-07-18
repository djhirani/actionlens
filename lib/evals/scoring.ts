export type EvalExpectation = {
  fixtureId: string;
  kind: "document" | "completion";
  expectedActionPresent: boolean;
  expectedActionKeywords: string[];
  expectedDeadlineDate: string | null;
  forbiddenDeadlineValues: string[];
  expectedExactEvidence: boolean;
  expectedHumanReview: boolean;
  expectedCompletionStatus: "appears_complete" | "needs_human_review" | "not_verified" | null;
  notes: string;
};

export type EvalObservation = {
  action: string | null;
  deadline: string | null;
  exactEvidence: boolean;
  humanReview: boolean;
  completionStatus: "appears_complete" | "needs_human_review" | "not_verified" | null;
  unsupportedClaimCount: number;
};

export type ScoredFixture = {
  fixtureId: string;
  actionCorrect: boolean;
  deadlineCorrect: boolean;
  evidenceCorrect: boolean;
  escalationCorrect: boolean;
  completionCorrect: boolean;
  inventedClaimCount: number;
  passed: boolean;
  failures: string[];
};

type Metric = { correct: number; total: number; percent: number | null };

function metric(correct: number, total: number): Metric {
  return { correct, total, percent: total ? Number(((correct / total) * 100).toFixed(1)) : null };
}

function actionMatches(expected: EvalExpectation, actual: EvalObservation) {
  if (!expected.expectedActionPresent) return actual.action === null;
  if (!actual.action) return false;
  const normalized = actual.action.toLocaleLowerCase("en-GB");
  return expected.expectedActionKeywords.every((keyword) =>
    normalized.includes(keyword.toLocaleLowerCase("en-GB"))
  );
}

function deadlineMatches(expected: EvalExpectation, actual: EvalObservation) {
  if (expected.expectedDeadlineDate === null) return actual.deadline === null;
  return actual.deadline?.slice(0, 10) === expected.expectedDeadlineDate;
}

export function scoreFixture(expected: EvalExpectation, actual: EvalObservation): ScoredFixture {
  const actionCorrect = actionMatches(expected, actual);
  const deadlineCorrect = deadlineMatches(expected, actual);
  const evidenceCorrect = actual.exactEvidence === expected.expectedExactEvidence;
  const escalationCorrect = actual.humanReview === expected.expectedHumanReview;
  const completionCorrect =
    expected.expectedCompletionStatus === null ||
    actual.completionStatus === expected.expectedCompletionStatus;
  const forbiddenDeadline = expected.forbiddenDeadlineValues.some(
    (value) => actual.deadline?.slice(0, 10) === value
  );
  const failures = [
    !actionCorrect && "action did not match the human label",
    !deadlineCorrect && "deadline did not match the human label",
    forbiddenDeadline && "a forbidden contextual date was used as the deadline",
    !evidenceCorrect && "exact-evidence behaviour did not match the human label",
    !escalationCorrect && "human-review escalation did not match the human label",
    !completionCorrect && "completion status did not match the human label",
    actual.unsupportedClaimCount > 0 &&
      `${actual.unsupportedClaimCount} model claim(s) had no deterministic source support`
  ].filter((failure): failure is string => Boolean(failure));

  return {
    fixtureId: expected.fixtureId,
    actionCorrect,
    deadlineCorrect: deadlineCorrect && !forbiddenDeadline,
    evidenceCorrect,
    escalationCorrect,
    completionCorrect,
    inventedClaimCount: actual.unsupportedClaimCount,
    passed: failures.length === 0,
    failures
  };
}

export function calculateMetrics(
  cases: Array<{ expected: EvalExpectation; actual: EvalObservation; score: ScoredFixture }>
) {
  const documentCases = cases.filter(({ expected }) => expected.kind === "document");
  const predictedActions = documentCases.filter(({ actual }) => actual.action !== null);
  const predictedDeadlines = documentCases.filter(({ actual }) => actual.deadline !== null);
  const refusalCases = documentCases.filter(
    ({ expected }) => expected.expectedDeadlineDate === null
  );
  const exactEvidenceCases = cases.filter(({ expected }) => expected.expectedExactEvidence);
  const escalationCases = cases.filter(({ expected }) => expected.expectedHumanReview);
  const completionCases = cases.filter(
    ({ expected }) => expected.expectedCompletionStatus !== null
  );

  return {
    actionPrecision: metric(
      predictedActions.filter(({ score }) => score.actionCorrect).length,
      predictedActions.length
    ),
    deadlinePrecision: metric(
      predictedDeadlines.filter(({ score }) => score.deadlineCorrect).length,
      predictedDeadlines.length
    ),
    unsupportedDeadlineRefusal: metric(
      refusalCases.filter(({ actual }) => actual.deadline === null).length,
      refusalCases.length
    ),
    evidenceExactMatchSuccess: metric(
      exactEvidenceCases.filter(({ actual }) => actual.exactEvidence).length,
      exactEvidenceCases.length
    ),
    ambiguityEscalation: metric(
      escalationCases.filter(({ actual }) => actual.humanReview).length,
      escalationCases.length
    ),
    completionResultCorrectness: metric(
      completionCases.filter(({ score }) => score.completionCorrect).length,
      completionCases.length
    ),
    inventedFactualClaimCount: cases.reduce(
      (total, { score }) => total + score.inventedClaimCount,
      0
    ),
    fixturesPassed: metric(cases.filter(({ score }) => score.passed).length, cases.length)
  };
}
