# ActionLens architecture

## Stage 1

ActionLens uses Next.js App Router with strict TypeScript. The browser sends a bounded typed instruction plus current local datetime, IANA timezone, and locale to a same-origin server route. The server calls the OpenAI Responses API using a server-only key and strict structured output, then validates the parsed result again with Zod.

```text
Typed instruction + time context
  → POST /api/interpret-text
  → OpenAI Responses API (server only)
  → strict structured output
  → Zod validation
  → editable in-memory draft
  → explicit human confirmation
  → IndexedDB through Dexie
```

Drafts are never written to IndexedDB. `saveConfirmed` changes the status to `confirmed` at the persistence boundary, so UI preview state cannot be mistaken for saved state.

The browser renders model-derived values as React text. The application does not use trusted HTML rendering.

## Boundaries

- Client: input, timezone context, editing, confirmation, IndexedDB.
- Server: API key, model invocation, upstream error sanitisation.
- Local persistence: confirmed Action Items only.
- Not implemented in Stage 1: documents, evidence verification, Proof of Done, voice, notifications, accounts, or cloud sync.

## Toolchain decision

Next.js 16.2.10 is paired with TypeScript 5.9.3 and ESLint 9.39.5. TypeScript 7 and ESLint 10 were inspected during Stage 1 but are not yet supported by the parser and lint-plugin versions in the current Next.js configuration.
