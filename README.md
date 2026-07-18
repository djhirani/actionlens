# ActionLens

ActionLens turns natural-language instructions into editable action drafts. Nothing is saved until the user explicitly confirms it.

## Stage 1 scope

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

## Document privacy

For text PDFs, ActionLens extracts text in the browser and sends extracted text to OpenAI for analysis. The original PDF is not sent or saved. Only a human-confirmed Action Card, its source hash, and minimal verified excerpts are stored locally in IndexedDB.

Completion checks compare later evidence with explicit criteria. `Appears complete` is an evidence-comparison result, not confirmation of official acceptance. An action remains open until the user chooses **Mark complete**.

The Action Inbox uses due language only. ActionLens does not promise browser notifications or background reminders when the app is closed.

ActionLens helps organise information. It does not provide legal, medical, financial, or official institutional advice.
