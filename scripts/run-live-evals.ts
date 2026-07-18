import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  COMPLETION_VERIFICATION_INSTRUCTIONS,
  DOCUMENT_ANALYSIS_INSTRUCTIONS
} from "../lib/ai/instructions";
import { calculateMetrics, scoreFixture, type EvalExpectation } from "../lib/evals/scoring";
import { applyClaimGate } from "../lib/proof/claim-gate";
import { applyCompletionGate, COMPLETION_DISCLAIMER } from "../lib/proof/completion-gate";
import {
  ActionItemSchema,
  ModelCompletionProposalSchema,
  ModelDocumentProposalSchema,
  type SourcePage
} from "../lib/schemas";

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL;
if (!apiKey || !model) {
  throw new Error("eval:live requires both OPENAI_API_KEY and OPENAI_MODEL");
}

const root = process.cwd();
const now = new Date();
const runId = now.toISOString().replaceAll(":", "-").replace(".", "-");
const outputDirectory = path.join(root, "evals", "results", runId);
const client = new OpenAI({ apiKey });
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const dirty =
  execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim().length > 0;
const timeContext = {
  currentDatetime: "2026-07-21T12:00:00+01:00",
  timezone: "Europe/London",
  locale: "en-GB"
};

function page(text: string): SourcePage[] {
  return [{ pageNumber: 1, text }];
}

function completionAction() {
  const timestamp = "2026-07-18T12:00:00.000Z";
  return ActionItemSchema.parse({
    id: "00000000-0000-4000-8000-000000000007",
    version: 1,
    status: "confirmed",
    title: "Upload sponsorship confirmation",
    action: "Upload sponsorship confirmation.",
    dueAt: null,
    context: null,
    uncertainty: { requiresHumanReview: false, reasons: [], clarificationQuestion: null },
    sourceText: "Upload sponsorship confirmation.",
    source: {
      kind: "pdf",
      displayName: "Synthetic requirement",
      sourceHash: "a".repeat(64),
      retained: false,
      extractedExcerptSaved: true
    },
    proofLink: {
      allRequiredClaimsVerified: true,
      blockedClaims: [],
      evidenceQuotes: ["Upload sponsorship confirmation."]
    },
    completionCriteria: [
      {
        id: "sponsorship-upload",
        description:
          "Evidence names the sponsorship confirmation document as uploaded or received.",
        required: true
      }
    ],
    provenance: {
      model,
      pipelineVersion: "stage-3-v1",
      analyzedAt: timestamp,
      timezone: timeContext.timezone,
      locale: timeContext.locale
    },
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

async function runDocument(source: string) {
  const pages = page(source);
  const response = await client.responses.parse({
    model,
    instructions: DOCUMENT_ANALYSIS_INSTRUCTIONS,
    input: JSON.stringify({ pages, timeContext }),
    text: { format: zodTextFormat(ModelDocumentProposalSchema, "document_action") }
  });
  const proposal = ModelDocumentProposalSchema.parse(response.output_parsed);
  const gated = applyClaimGate(proposal, pages);
  return {
    proposal,
    gated,
    observation: {
      action: gated.requiredAction,
      deadline: gated.deadline,
      exactEvidence:
        gated.evidence.length > 0 &&
        gated.evidence.every((evidence) => evidence.verificationStatus === "verified"),
      humanReview: gated.requiresHumanReview,
      completionStatus: null,
      unsupportedClaimCount: gated.evidence.filter(
        (evidence) => evidence.verificationStatus === "unsupported"
      ).length
    }
  };
}

async function runCompletion(source: string) {
  const evidenceText = source.split("Completion evidence:\n")[1]?.trim() ?? "";
  const pages = page(evidenceText);
  const action = completionAction();
  const response = await client.responses.parse({
    model,
    instructions: COMPLETION_VERIFICATION_INSTRUCTIONS,
    input: JSON.stringify({
      action: action.action,
      completionCriteria: action.completionCriteria,
      originalVerifiedQuotes: action.proofLink?.evidenceQuotes ?? [],
      completionEvidencePages: pages,
      timeContext,
      requiredDisclaimer: COMPLETION_DISCLAIMER
    }),
    text: { format: zodTextFormat(ModelCompletionProposalSchema, "completion_check") }
  });
  const proposal = ModelCompletionProposalSchema.parse(response.output_parsed);
  const gated = applyCompletionGate(action, proposal, pages, {
    displayName: "Synthetic completion evidence",
    sourceHash: "b".repeat(64)
  });
  return {
    proposal,
    gated: { ...gated, sourcePages: undefined },
    observation: {
      action: action.action,
      deadline: null,
      exactEvidence:
        gated.matchedCriteria.length > 0 &&
        gated.matchedCriteria.every((match) => match.evidence.verificationStatus === "verified"),
      humanReview: gated.status !== "appears_complete",
      completionStatus: gated.status,
      unsupportedClaimCount: gated.matchedCriteria.filter(
        (match) => match.evidence.verificationStatus === "unsupported"
      ).length
    }
  };
}

function metricCell(metric: { correct: number; total: number; percent: number | null }) {
  return `${metric.correct}/${metric.total} (${metric.percent === null ? "n/a" : `${metric.percent}%`})`;
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const cases = [];
  for (let number = 1; number <= 8; number += 1) {
    const fixtureId = `fixture-${String(number).padStart(2, "0")}`;
    const fixtureDirectory = path.join(root, "evals", "fixtures", fixtureId);
    const source = await readFile(path.join(fixtureDirectory, "source.txt"), "utf8");
    const expected = JSON.parse(
      await readFile(path.join(fixtureDirectory, "expected.json"), "utf8")
    ) as EvalExpectation;
    const output =
      expected.kind === "document" ? await runDocument(source) : await runCompletion(source);
    const score = scoreFixture(expected, output.observation);
    cases.push({ expected, actual: output.observation, score });
    await writeFile(
      path.join(outputDirectory, `${fixtureId}.json`),
      `${JSON.stringify({ fixtureId, expected, ...output, score }, null, 2)}\n`
    );
    process.stdout.write(`${fixtureId}: ${score.passed ? "PASS" : "FAIL"}\n`);
  }

  const metrics = calculateMetrics(cases);
  const metadata = {
    runId,
    timestamp: now.toISOString(),
    model,
    pipelineVersion: "stage-5-v1",
    sourceCommit,
    workingTreeDirty: dirty
  };
  const result = { metadata, metrics, cases };
  await writeFile(
    path.join(outputDirectory, "results.json"),
    `${JSON.stringify(result, null, 2)}\n`
  );

  const rows = cases
    .map(({ expected, score }) => {
      const resultCell = score.passed ? "PASS" : `FAIL: ${score.failures.join("; ")}`;
      return `| ${expected.fixtureId} | ${score.actionCorrect ? "pass" : "fail"} | ${score.deadlineCorrect ? "pass" : "fail"} | ${score.evidenceCorrect ? "pass" : "fail"} | ${score.escalationCorrect ? "pass" : "fail"} | ${score.completionCorrect ? "pass" : "fail"} | ${score.inventedClaimCount} | ${resultCell} |`;
    })
    .join("\n");
  const limitations = cases
    .filter(({ score }) => !score.passed)
    .map(({ expected, score }) => `- ${expected.fixtureId}: ${score.failures.join("; ")}`);
  const markdown = `# ActionLens live evaluation — ${runId}

- Timestamp: ${metadata.timestamp}
- Model: ${metadata.model}
- Pipeline: ${metadata.pipelineVersion}
- Source commit: ${metadata.sourceCommit}${dirty ? " (working tree had Stage 5 changes)" : ""}
- Fixture data: synthetic only; no real personal information

| Fixture | Action | Deadline | Evidence | Escalation | Completion | Invented claims | Result |
|---|---|---|---|---|---|---:|---|
${rows}

## Metrics

- Action precision: ${metricCell(metrics.actionPrecision)}
- Deadline precision: ${metricCell(metrics.deadlinePrecision)}
- Unsupported-deadline refusal: ${metricCell(metrics.unsupportedDeadlineRefusal)}
- Evidence exact-match success: ${metricCell(metrics.evidenceExactMatchSuccess)}
- Ambiguity escalation: ${metricCell(metrics.ambiguityEscalation)}
- Completion-result correctness: ${metricCell(metrics.completionResultCorrectness)}
- Invented factual claim count: ${metrics.inventedFactualClaimCount}
- Fixtures passed: ${metricCell(metrics.fixturesPassed)}

## Failures and limitations

${limitations.length ? limitations.join("\n") : "- No fixture-level failures in this run."}

The same model becomes safer when claims pass through deterministic proof-link verification.
`;
  await writeFile(path.join(outputDirectory, "summary.md"), markdown);
  await writeFile(
    path.join(root, "evals", "results", "latest.json"),
    `${JSON.stringify(result, null, 2)}\n`
  );
  await writeFile(path.join(root, "evals", "results", "latest.md"), markdown);

  process.stdout.write(`Results: ${path.relative(root, outputDirectory)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(
    `Live evaluation failed: ${error instanceof Error ? error.message : "Unknown error"}\n`
  );
  process.exitCode = 1;
});
