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

## Stage 2 document pipeline

```text
PDF File (browser memory only)
  → MIME + %PDF- signature validation
  → PDF.js local text extraction (≤5 pages, ≤50,000 characters)
  → deterministic normalization + SHA-256 source hash
  → extracted page text sent to POST /api/analyze-document
  → GPT-5.6 structured claim and exact-quote proposals
  → repeated Zod validation
  → pure deterministic evidence matcher
  → conservative claim gate
  → Evidence Bridge draft
  → explicit human confirmation
  → minimal local Action Item
```

The model cannot set verification status. `lib/documents/evidence-match.ts` awards `verified` only after an exact substring match using the same deterministic normalization for source and quote. A strict near match is always `near_match_review`; it never receives a verified badge.

The claim gate applies after matching:

- unsupported required action becomes `null` and blocks confirmation;
- unsupported deadline becomes `null`;
- unsupported consequence becomes `null`;
- near matches require human review;
- conflicts keep the result non-confirmable;
- only exact verification for every required claim permits confirmation.

Normalization applies Unicode NFKC, smart-quote and dash canonicalisation, whitespace collapse, and conservative lowercase line-break hyphen repair. Each normalized character retains an original source index so the Evidence Bridge can highlight matched text without HTML injection.

The built-in bait fixture is deterministic and synthetic. It visibly demonstrates that `30 July 2026`, an office closure date, does not become an action deadline. It does not invoke or impersonate a live model result.
