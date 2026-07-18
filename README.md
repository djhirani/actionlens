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

Proof of Done, image OCR, voice, notifications, accounts, and cloud sync are intentionally not implemented yet.

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

ActionLens helps organise information. It does not provide legal, medical, financial, or official institutional advice.
