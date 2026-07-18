# ActionLens

ActionLens turns natural-language instructions into editable action drafts. Nothing is saved until the user explicitly confirms it.

## Product scope

- Typed instruction to validated Action Card
- Timezone-aware interpretation through the OpenAI Responses API
- Edit, confirm, and discard controls
- Confirmed actions stored locally in IndexedDB
- Minimal local Action Inbox
- Text-based PDF extraction in the browser with five-page and 50,000-character limits
- Deterministic source-quote matching and claim refusal gate
- Built-in “No deadline stated” demonstration
- Proof of Done checks for pasted text and text-based PDFs
- Deterministic completion-evidence verification with human-controlled closure
- Local Action Inbox grouped into Today, Upcoming, and Completed
- Due/overdue, source-verification, and ambiguity states
- Action detail, proof history, and local deletion controls

Image OCR, voice, notifications, accounts, and cloud sync are intentionally not implemented yet.

## Measured evaluation

The final Stage 5 controlled run used `gpt-5.6` on eight synthetic, human-labelled fixtures. It measured 3/3 action precision, 1/1 deadline precision, 5/5 unsupported-deadline refusal, 4/4 exact-evidence success, 2/2 ambiguity escalation, 2/2 completion correctness, and zero unsupported factual claims. All 8/8 fixtures passed. Earlier failing runs remain under `evals/results/`; the generated final table is in `evals/results/latest.md`.

The same model becomes safer when claims pass through deterministic proof-link verification.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `OPENAI_API_KEY` and keep `OPENAI_MODEL=gpt-5.6`. The key is used only by the server route.

## Verification

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Run the live synthetic evaluation manually with both environment variables set:

```bash
OPENAI_API_KEY=... OPENAI_MODEL=gpt-5.6 npm run eval:live
```

Each run receives a unique timestamped directory. Live evaluation is deliberately excluded from automatic pull-request CI.

## Document privacy

For text PDFs, ActionLens extracts text in the browser and sends extracted text to OpenAI for analysis. The original PDF is not sent or saved. Only a human-confirmed Action Card, its source hash, and minimal verified excerpts are stored locally in IndexedDB.

Completion checks compare later evidence with explicit criteria. `Appears complete` is an evidence-comparison result, not confirmation of official acceptance. An action remains open until the user chooses **Mark complete**.

The Action Inbox uses due language only. ActionLens does not promise browser notifications or background reminders when the app is closed.

ActionLens helps organise information. It does not provide legal, medical, financial, or official institutional advice.
