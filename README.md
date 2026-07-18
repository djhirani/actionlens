# ActionLens

ActionLens turns natural-language instructions into editable action drafts. Nothing is saved until the user explicitly confirms it.

## Stage 1 scope

- Typed instruction to validated Action Card
- Timezone-aware interpretation through the OpenAI Responses API
- Edit, confirm, and discard controls
- Confirmed actions stored locally in IndexedDB
- Minimal local Action Inbox

Document upload, Proof of Done, voice, notifications, accounts, and cloud sync are intentionally not part of Stage 1.

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
npm run build
```

ActionLens helps organise information. It does not provide legal, medical, financial, or official institutional advice.
