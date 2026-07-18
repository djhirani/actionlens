# Build log

## 2026-07-18 — Stage 1: Foundation and text-to-action

- Initialised the Next.js App Router application with strict TypeScript and Tailwind.
- Added a server-only GPT-5.6 Responses API integration using strict structured output and repeat Zod validation.
- Added timezone-aware typed action capture, loading, preview, edit, confirm, and discard states.
- Added Dexie persistence that accepts only explicitly confirmed actions and a minimal Action Inbox.
- Added deterministic mocked tests for schemas, time context, confirmation, discard, and IndexedDB.
- Kept PDF processing, Proof of Done, voice, notifications, accounts, and cloud sync out of scope.
- Pinned TypeScript 5.9.3 and ESLint 9.39.5 after the registry-latest major versions proved incompatible with the current Next.js lint toolchain.

### Verification

- `npm install --cache /private/tmp/actionlens-npm-cache` — passed; 454 packages audited during installation.
- `npm run format` / `npm run format:check` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run typecheck` — passed.
- `npm test` — passed: 4 files, 9 tests.
- `npm run build` — passed; `/`, `/inbox`, and `/api/interpret-text` built successfully.
- `npm audit --audit-level=moderate` — reported two moderate findings in the PostCSS version bundled inside Next.js 16.2.10. The automated force-fix proposes a breaking downgrade to Next.js 9.3.3 and was intentionally not applied.

Verification results and the final commit SHA are recorded in the Stage 1 completion report.

## 2026-07-18 — Stage 2: Document to Proof-Linked Action

- Added browser-only text PDF validation and extraction with `pdfjs-dist`.
- Enforced PDF MIME/magic bytes, 10 MB, 5-page, and 50,000-character limits with encrypted/image-only error handling.
- Added deterministic normalization, source hashing, exact quote matching, strict near-match review, original offset mapping, and conservative claim gating.
- Added GPT-5.6 structured document extraction through the Responses API; the model proposes evidence but cannot assign verification status.
- Added the privacy sheet, Evidence Bridge, blocked/conflict states, and confirmation restrictions.
- Added the synthetic “No deadline stated” bait fixture and home-screen demo control.
- Added `docs/PRIVACY.md`, Playwright configuration, and Stage 2 tests.

### Verification

- `npm install --cache /private/tmp/actionlens-npm-cache` — passed; 460 packages installed/audited.
- `npm run format:check` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run typecheck` — passed.
- `npm test` — passed: 9 files, 26 tests.
- `npm run test:e2e` — passed: 1 Chromium bait-flow test.
- `npm run build` — passed, including `/api/analyze-document`.
- The pre-existing two moderate PostCSS advisories remain transitive through Next.js 16.2.10; npm's force-fix proposes an unsafe Next.js 9 downgrade and was not applied.

Proof of Done, completion evidence, image OCR, voice, and notifications remain outside Stage 2.

## 2026-07-18 — Stage 3: Proof of Done

- Added explicit required completion criteria to confirmed document-derived actions and a conservative migration for existing local Stage 2 actions.
- Added pasted-text and text-PDF completion evidence with 3-page and 30,000-character limits.
- Added GPT-5.6 structured completion comparison through `/api/verify-completion`.
- Added deterministic completion quote verification and application-controlled tri-state gating.
- Added Action detail pages, completion history, and explicit Mark complete / Keep open / Add more evidence controls.
- Added opt-in retention for verified completion excerpts; original files, complete evidence text, near matches, and unsupported quotes are not persisted.
- Added synthetic weak and strong Proof of Done fixtures and a built-in demo.

### Verification

- `npm run format:check` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run typecheck` — passed.
- `npm test` — passed: 11 files, 37 tests.
- `npm run test:e2e` — passed: 3 Chromium tests covering deadline bait, weak-proof rejection/history, and strong-proof human closure.
- `npm run build` — passed, including `/actions/[id]`, `/api/verify-completion`, and `/proof-demo`.
- The existing two moderate PostCSS advisories remain transitive through Next.js 16.2.10; the breaking automated downgrade was not applied.

Image/OCR evidence, screenshots, voice, notifications, and Stage 4 inbox expansion remain out of scope.

## 2026-07-18 — Stage 4: Action Inbox

- Replaced the confirmed-only list with Today, Upcoming, and Completed groups.
- Added timezone-aware due/overdue computation, undated handling, group counts, and empty states.
- Kept completed actions visible after human closure.
- Added source-verification, ambiguity, due, and local-status badges.
- Expanded action details with due metadata, live closure status, completion history, and explicit deletion.
- Added atomic local deletion for actions and their completion checks.
- Improved mobile navigation and sticky inbox tabs.
- Omitted optional voice to protect proof-loop stability and Stage 5 readiness.

### Verification

- Pre-change regression: 11 files / 37 tests and 3 Playwright tests passed.
- `npm run format:check` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run typecheck` — passed.
- `npm test` — passed: 12 files, 42 tests.
- `npm run test:e2e` — passed: 3 Chromium tests, including completed grouping and deletion.
- `npm run build` — passed.
- The existing two moderate PostCSS advisories remain transitive through Next.js 16.2.10; the breaking automated downgrade was not applied.

Voice, notifications, image OCR, accounts, cloud sync, and Stage 5 eval work remain out of scope.

## 2026-07-18 — Stage 5: Evals, security, and privacy

- Added all eight visibly marked synthetic source fixtures and machine-readable human labels.
- Added `npm run eval:live` with unique run directories, raw structured proposals, gated outputs, generated JSON/Markdown results, exact denominators, model ID, timestamp, pipeline version, and source commit.
- Preserved the initial 3/8 run and post-fix 7/8 run rather than overwriting failures.
- Strengthened untrusted-document prompt-injection instructions, date-only deadline handling, refusal gates, empty-quote rejection, request-body limits, sanitized failure paths, and browser security headers.
- Added deterministic security, evaluation-scoring, prompt-injection, refusal, and malformed/oversized request tests.
- Added lockfile-based GitHub Actions for format, lint, type checking, unit/integration tests, and production build. Live model evals are excluded from automatic CI.
- Documented threat assumptions, cloud/local boundaries, deletion, cost-abuse limits, and deployment responsibilities.

### Final measured live evaluation

Controlled run `2026-07-18T03-04-37-694Z` used `gpt-5.6` and Stage 5 pipeline changes based on source commit `209cdbb`:

- action precision: 3/3 (100%);
- deadline precision: 1/1 (100%);
- unsupported-deadline refusal: 5/5 (100%);
- evidence exact-match success: 4/4 (100%);
- ambiguity escalation: 2/2 (100%);
- completion-result correctness: 2/2 (100%);
- invented factual claim count: 0;
- fixtures passed: 8/8 (100%).

These are measured synthetic-fixture results, not a claim of general-world accuracy. The same model becomes safer when claims pass through deterministic proof-link verification.

### Verification

- `npm run format` / `npm run format:check` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run typecheck` — passed.
- `npm test` — passed: 14 files, 48 tests.
- `npm run test:e2e` — final rerun passed: 3 Chromium tests. The first attempt passed 2/3 but its initial page load hit a stale React client manifest after Next.js selected a parent-directory lockfile as the workspace root; pinning `turbopack.root` to this repository and rebuilding the generated cache resolved it.
- `npm run build` — passed with all static and dynamic routes generated.
- `npm audit --audit-level=moderate` — reported two moderate PostCSS findings transitive through Next.js 16.2.10. The available force-fix would install the breaking and obsolete Next.js 9.3.3, so it was not applied.
- Secret-pattern and unsafe-rendering review found no credential in evaluation artifacts, no application logging of document content, and no `dangerouslySetInnerHTML` use.

## 2026-07-18 — Stage 6: Prize-quality UX and demo path

- Rebuilt the presentation around a white central surface, deep navy/ink typography, strong blue actions, amber ambiguity, and red blocked/unsupported states.
- Refined the signature Evidence Bridge with an exact-quote label, highlighted source evidence, verification badge, and source-to-card desktop/mobile reading order.
- Added a coherent 30-second judge path with synthetic refusal, source-verified document, weak proof, strong proof, human closure, and Inbox display.
- Added demo-only reset that removes the fixed synthetic action and its proof history without touching user actions.
- Polished privacy, honest extraction/analysis/evidence-check progress, unsupported/error/offline messaging, empty states, and mobile controls.
- Added skip navigation, visible focus, reduced motion, large tap targets, semantic status announcements, and automated axe coverage.
- Preserved the Stage 5 proof loop, deterministic verification, refusal rules, Evidence Bridge semantics, and human-only closure.

### Verification

- `npm run format` / `npm run format:check` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run typecheck` — passed.
- `npm test` — passed: 14 files, 48 tests.
- `npm run test:e2e` — passed: 6 Chromium tests. This includes desktop/mobile axe scans, keyboard skip-link focus, the existing refusal and Proof of Done flows, and the complete built-in judge path repeated three consecutive times.
- Desktop screenshots at 1440px and mobile screenshots at 390px were captured and visually inspected for the home surface, verified Evidence Bridge, refusal state, and strong Proof of Done state.
- `npm run build` — passed with all static and dynamic routes generated.
- Dependency installation continued to report the two known moderate PostCSS advisories transitive through Next.js 16.2.10; no breaking forced downgrade was applied.

## 2026-07-18 — Stage 7: Deployment and submission package

- Starting commit: `d229047`; primary Stage 7 submission commit: `5bd7227`; final evidence-only commit is reported in the completion report.
- Rewrote the README for judge scanning with the problem, Proof Loop, architecture, setup, environment boundaries, commands, live path, measured results, privacy, GPT-5.6/Codex roles, human decisions, dated milestones, synthetic notice, limitations, and licence.
- Added an MIT licence, Vercel deployment runbook/evidence, under-three-minute narrated script, exact click path, product-accurate Devpost copy, submission checklist, and Codex evidence file.
- Preserved primary Codex thread `019f72a7-65bd-7071-8682-10b3b216d4af`; left the `/feedback` ID explicitly pending rather than inventing it.
- Linked Vercel project `hirani/actionlens` and configured production-only `OPENAI_API_KEY` and `OPENAI_MODEL` without storing values.
- Kept the GitHub repository private; owner must choose public visibility or rule-compliant private judge access before submission.
- Ran final live evaluation `2026-07-18T09-08-22-425Z`: 8/8 fixtures passed, all requested metric counts were 100%, and unsupported factual claim count was zero.

### Owner decisions

- No completed product stage was redesigned or reopened.
- No excluded voice, OCR, notification, account, provider-routing, or cloud-sync feature was added.
- Repository visibility and OpenAI budget level remain owner-controlled external decisions.

### Codex contribution

Codex audited release readiness, prepared submission materials from actual product behavior, configured the authenticated deployment target, ran the final deterministic and live verification, deployed/smoke-tested where credentials allowed, and recorded blockers and manual handoff steps without fabricating evidence.

### Known limitation

The repository is private and Vercel Git integration could not connect because the authenticated Vercel GitHub identity lacks access. CLI deployment remains available. The `/feedback` action must be run manually in the primary Codex thread.

### Verification

- `npm run format` / `npm run format:check` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run typecheck` — passed.
- `npm test` — passed: 14 files, 48 tests.
- `npm run test:e2e` — passed: 6 Chromium tests, including axe checks and the complete judge path repeated three times.
- `npm run eval:live` — final controlled run passed 8/8 with zero unsupported factual claims.
- `npm run build` — passed locally; Vercel’s independent production build also passed.
- `npm audit --audit-level=moderate` — the two documented Next.js-transitive PostCSS advisories remain; the unsafe breaking force-fix was not applied.
- Vercel deployment `dpl_FqcEms8E9pAdGFHSQZw6H8MpkVju` — READY at `https://actionlens-five.vercel.app`.
- `npm run smoke:live` against production — 3/3 complete synthetic flows passed; API sanitisation passed.
