# ActionLens — Devpost submission copy

## Elevator pitch

ActionLens turns high-stakes documents into proof-linked actions, refuses to invent missing deadlines, and checks completion evidence before the user closes the task.

## Inspiration

People often miss important administrative actions not because information is unavailable, but because requirements, dates, and proof are scattered across formal documents. Summaries help with comprehension, but they do not show whether a claimed deadline is actually supported or whether the task was truly completed.

## What it does

ActionLens implements a human-controlled Proof Loop:

> Source → Proof-Linked Action → Human confirmation → Completion evidence → Proof of Done → Human-confirmed closure

GPT-5.6 proposes structured actions, deadlines, ambiguity, completion criteria, and evidence quotes. Deterministic code verifies those quotes against the supplied source. Unsupported deadlines are refused, conflicts are escalated, weak completion receipts are rejected, and even strong evidence waits for the user to select Mark complete.

The browser-local Action Inbox groups Today, Upcoming, and Completed actions while keeping completed proof history visible.

## How we built it

- Next.js App Router, React, strict TypeScript, and Zod
- OpenAI Responses API with GPT-5.6 structured output
- Browser-side PDF.js text extraction and SHA-256 hashing
- Deterministic normalization, exact/near quote matching, and conservative claim gates
- Dexie/IndexedDB for confirmed local actions and proof history
- Vitest, Playwright, axe, GitHub Actions, and a reproducible live evaluation runner

The same model becomes safer when claims pass through deterministic proof-link verification.

## How GPT-5.6 is used

GPT-5.6 performs structured instruction/document interpretation, date-role classification, ambiguity detection, completion-criteria generation, and completion-evidence comparison. It cannot assign verification status, persist an action, mark it complete, or confirm official acceptance.

## How Codex was used

Codex was the primary engineering collaborator. In the primary Build Week thread it audited and implemented the application, OpenAI routes, local persistence, deterministic verification gates, Evidence Bridge, Proof of Done, Inbox, security/privacy hardening, synthetic eval runner, responsive UI, automated tests, CI, and submission documentation. It ran real evals, preserved failing runs, and verified the complete judge path.

Primary Codex thread ID: `019f72a7-65bd-7071-8682-10b3b216d4af`

Codex `/feedback` session ID: **PENDING — run `/feedback` in the primary thread and insert the exact returned ID before submission.**

## Human decisions

The owner chose deterministic source proof over model confidence, explicit refusal of unsupported deadlines, human confirmation before saving and closure, minimal browser-local storage, and a strict cut of voice, OCR, notifications, accounts, provider routing, and cloud sync so the core proof loop remained reliable.

## Measured result

The final controlled GPT-5.6 run passed 8/8 human-labelled synthetic fixtures: 3/3 action precision, 1/1 deadline precision, 5/5 unsupported-deadline refusal, 4/4 exact-evidence success, 2/2 ambiguity escalation, 2/2 completion correctness, and zero unsupported factual claims. This is a small synthetic benchmark, not a claim of general-world accuracy. Earlier failing runs remain in the repository.

## Challenges and accomplishments

The central challenge was separating model reasoning from proof. Model quotes are only proposals; application code must find them in the original text before a claim is trusted. The completion gate similarly recomputes status rather than accepting the model’s suggested status. The strongest result is a complete, measured loop from source to human-confirmed closure—not another summary screen.

## Limitations

ActionLens is demonstration software, not professional advice. It supports text-based unencrypted PDFs, not OCR or screenshots. Exact matching establishes text presence, not document authenticity or official acceptance. Data is browser-local and does not sync. There are no notifications, accounts, cloud database, or distributed API rate limits.

## Testing instructions

1. Reset demo data on the home page.
2. Run **Try the “No deadline stated” demo** and confirm no 30 July deadline is created.
3. Run **Try a source-verified action** and inspect the Evidence Bridge.
4. Confirm the synthetic action.
5. Open **Try Proof of Done**.
6. Run weak evidence and confirm Mark complete is disabled.
7. Run strong evidence, then choose Mark complete.
8. Open Action Inbox → Completed and inspect the saved proof history.

No personal document or external account is required. All built-in documents are visibly marked synthetic and contain no real personal information.
