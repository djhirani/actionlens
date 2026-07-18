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
