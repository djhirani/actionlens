# ActionLens

**ActionLens turns everyday instructions and text-based PDFs into proof-linked actions, refuses unsupported deadlines, and checks completion evidence before a human closes the task.**

Built with GPT-5.6 and Codex for OpenAI Build Week 2026.

- Live app: <https://actionlens-five.vercel.app>
- Repository: <https://github.com/djhirani/actionlens> (private at Stage 7 start; judge access still required)
- Final measured evaluation: [8/8 synthetic fixtures](evals/results/latest.md)
- Build evidence: [dated Git history](docs/build-week/git-history.txt) and [build log](docs/BUILD_LOG.md)

## The problem

Important actions are buried in university, council, tenancy, insurance, and other administrative documents. A fluent summary can still attach the wrong date to an action or make weak completion evidence sound conclusive. ActionLens keeps the source, proof, and human decision visible.

## The Proof Loop

```text
Source
  → GPT-5.6 structured claim proposal
  → deterministic exact-quote verification
  → Proof-Linked Action
  → human confirmation
  → completion evidence
  → deterministic Proof of Done gate
  → human-confirmed closure
```

### Proof-Linked Actions

Text is extracted from a supported PDF in the browser. GPT-5.6 proposes an action, deadline, completion criteria, and exact evidence quotes. Application code—not the model—normalises and matches every quote against the supplied source. The Evidence Bridge shows the highlighted source beside the proposed Action Card.

### Refusal Gate

Unsupported claims do not receive a verified badge. Unsupported deadlines are removed, conflicting interpretations require review, and a draft cannot be confirmed while required claims remain blocked. The built-in bait document mentions 30 July only as an office closure date; ActionLens correctly creates no deadline.

### Proof of Done

Later evidence is compared with the action’s explicit completion criteria. A generic “File uploaded successfully” receipt is rejected because it does not name the required document. Strong named evidence may produce `Appears complete`, but only the user can select **Mark complete**.

## Architecture and privacy

```text
Browser                                    Same-origin Next.js server
PDF validation and text extraction        Server-only OPENAI_API_KEY
SHA-256 source hashing                     OpenAI Responses API + Zod output
Deterministic quote highlighting     ←     Structured claim proposals
IndexedDB confirmed actions/history
```

- Original PDF bytes are not sent to OpenAI or stored by ActionLens.
- Extracted text is sent to OpenAI for analysis; the interface discloses this before upload.
- Drafts are transient. Confirmed actions and minimal proof excerpts are stored in browser IndexedDB.
- Completion excerpts are retained only when the user opts in.
- Document and completion text is treated as untrusted data; embedded instructions cannot override extraction rules.
- API errors are sanitised and request, file, page, and character limits are enforced.

See [architecture](docs/ARCHITECTURE.md) and [privacy/threat assumptions](docs/PRIVACY.md).

## Local setup

Requirements: Node.js 20.9+ and an OpenAI API project with access to the configured model.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Configure `.env.local`:

| Variable         | Required | Exposure                                      | Purpose                                                                          |
| ---------------- | -------: | --------------------------------------------- | -------------------------------------------------------------------------------- |
| `OPENAI_API_KEY` |      Yes | Server only; never prefix with `NEXT_PUBLIC_` | OpenAI Responses API authentication                                              |
| `OPENAI_MODEL`   |      Yes | Server/runtime configuration                  | Model ID used by extraction and completion checks; Build Week run used `gpt-5.6` |

Never commit `.env.local`, paste keys into client code, or expose them in screenshots/logs. On Vercel, add both variables to the Production environment and configure OpenAI project budget/usage alerts in the OpenAI platform.

## Commands

```bash
npm run format:check  # formatting
npm run lint          # ESLint, zero warnings
npm run typecheck     # strict TypeScript
npm test              # Vitest unit/integration suite
npm run test:e2e      # Playwright proof-loop + axe checks
npm run build         # production Next.js build
npm run eval:live     # manual, credentialed eight-fixture live evaluation
```

Live evals never run automatically on pull requests. Every run gets a unique directory and preserves failures.

## Two-minute live demo path

No personal document or external account is required.

1. Select **Try the “No deadline stated” demo** and show that 30 July is refused as a deadline.
2. Select **Try a source-verified action** and show the exact-quote Evidence Bridge.
3. Confirm the synthetic Proof-Linked Action.
4. Open **Try Proof of Done**.
5. Select **Try weak evidence** and show `Not verified` with **Mark complete** disabled.
6. Select **Try strong evidence**, show the verified quote, then choose **Mark complete**.
7. Open the Action Inbox and show the action remains visible under Completed.
8. Use **Reset demo data** before another run.

The automated browser suite repeats this complete judge path three consecutive times.

## Measured results

Final controlled run `2026-07-18T09-08-22-425Z` used `gpt-5.6` on eight visibly marked synthetic documents containing no real personal information.

| Metric                       | Measured result |
| ---------------------------- | --------------: |
| Action precision             |      3/3 (100%) |
| Deadline precision           |      1/1 (100%) |
| Unsupported-deadline refusal |      5/5 (100%) |
| Exact-evidence success       |      4/4 (100%) |
| Ambiguity escalation         |      2/2 (100%) |
| Completion correctness       |      2/2 (100%) |
| Unsupported factual claims   |               0 |
| Fixtures passed              |      8/8 (100%) |

These small synthetic results demonstrate the tested pipeline; they are not a claim of general-world accuracy. Earlier 3/8 and 7/8 runs remain committed. **The same model becomes safer when claims pass through deterministic proof-link verification.**

Current deterministic verification: 14 test files / 48 tests. Browser verification: 6 Playwright tests, including desktop/mobile axe scans and the three-cycle judge path.

## How GPT-5.6 is used

GPT-5.6 performs structured instruction interpretation, document claim extraction, date-role classification, ambiguity detection, completion-criteria generation, and comparison of later evidence. Strict Zod schemas bound its output. GPT-5.6 never assigns the final source-verification badge, never changes action status directly, and never makes the user’s closure decision.

## How Codex was used

Codex was the primary engineering collaborator throughout OpenAI Build Week. In the primary thread it audited the starter repository; implemented the Next.js app, OpenAI integrations, local persistence, deterministic proof gates, Evidence Bridge, Proof of Done, inbox, security hardening, evaluation runner, responsive UI, tests, CI, and submission evidence; ran measured live evals; and recorded real failures before fixes.

Primary Codex thread ID: `019f72a7-65bd-7071-8682-10b3b216d4af`

Codex `/feedback` session ID: **PENDING — the owner must run `/feedback` in the primary thread and paste the exact returned ID here, in Devpost, and in private submission notes.**

The human owner made the central product decisions: deterministic proof-link verification over model confidence, refusal of unsupported deadlines, explicit human confirmation before persistence and closure, local-first minimal storage, and cutting voice, OCR, notifications, provider routing, accounts, and cloud sync to protect the core proof loop.

## Dated build summary

| Date       | Commit    | Milestone                                   |
| ---------- | --------- | ------------------------------------------- |
| 2026-07-18 | `aad3ee8` | Typed action capture and local confirmation |
| 2026-07-18 | `4fedac2` | Deterministic proof-linked PDF actions      |
| 2026-07-18 | `15064df` | Proof of Done verification loop             |
| 2026-07-18 | `209cdbb` | Local Action Inbox and proof history        |
| 2026-07-18 | `cf5be16` | Reproducible evals and security hardening   |
| 2026-07-18 | `9bad061` | Prize-quality responsive demo experience    |
| 2026-07-18 | `d229047` | Build Week Git evidence                     |

## Limitations

- Demonstration software, not legal, medical, financial, or official institutional advice.
- Text-based, unencrypted PDFs only: maximum 10 MB, 5 pages, and 50,000 extracted characters.
- No OCR, screenshots, image evidence, voice, notifications, accounts, cloud sync, or cross-device storage.
- Exact quote matching proves text presence, not document authenticity, completeness, or official acceptance.
- Browser-local data inherits the browser/device security and retention model.
- Public API routes have request limits but no distributed rate limiting, authentication, quota, or bot protection; production operators must add infrastructure controls and OpenAI project budgets.
- Two moderate PostCSS advisories remain transitive through Next.js 16.2.10; npm’s offered forced fix is an unsafe downgrade to Next.js 9.3.3.

## Synthetic-fixture notice

All built-in and evaluation documents are original synthetic demonstration material, visibly marked **“Synthetic demonstration document — no real personal information.”** No real logos, letterheads, addresses, account identifiers, or personal records are used.

## Licence

[MIT](LICENSE)
