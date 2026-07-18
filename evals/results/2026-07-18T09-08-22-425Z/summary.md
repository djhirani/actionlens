# ActionLens live evaluation — 2026-07-18T09-08-22-425Z

- Timestamp: 2026-07-18T09:08:22.425Z
- Model: gpt-5.6
- Pipeline: stage-5-v1
- Source commit: d22904743d63b1920c87e821bf4787e9ee16ec08 (working tree had uncommitted changes)
- Fixture data: synthetic only; no real personal information

| Fixture    | Action | Deadline | Evidence | Escalation | Completion | Invented claims | Result |
| ---------- | ------ | -------- | -------- | ---------- | ---------- | --------------: | ------ |
| fixture-01 | pass   | pass     | pass     | pass       | pass       |               0 | PASS   |
| fixture-02 | pass   | pass     | pass     | pass       | pass       |               0 | PASS   |
| fixture-03 | pass   | pass     | pass     | pass       | pass       |               0 | PASS   |
| fixture-04 | pass   | pass     | pass     | pass       | pass       |               0 | PASS   |
| fixture-05 | pass   | pass     | pass     | pass       | pass       |               0 | PASS   |
| fixture-06 | pass   | pass     | pass     | pass       | pass       |               0 | PASS   |
| fixture-07 | pass   | pass     | pass     | pass       | pass       |               0 | PASS   |
| fixture-08 | pass   | pass     | pass     | pass       | pass       |               0 | PASS   |

## Metrics

- Action precision: 3/3 (100%)
- Deadline precision: 1/1 (100%)
- Unsupported-deadline refusal: 5/5 (100%)
- Evidence exact-match success: 4/4 (100%)
- Ambiguity escalation: 2/2 (100%)
- Completion-result correctness: 2/2 (100%)
- Invented factual claim count: 0
- Fixtures passed: 8/8 (100%)

## Failures and limitations

- No fixture-level failures in this run.

The same model becomes safer when claims pass through deterministic proof-link verification.
