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

## Stage 3 Proof of Done pipeline

```text
Confirmed document action + explicit completion criteria
  + pasted text or locally extracted text PDF
  → SHA-256 completion-source hash
  → POST /api/verify-completion
  → GPT-5.6 comparison and exact-quote proposals
  → repeated Zod validation
  → deterministic quote matching
  → conservative completion gate
  → pending completion check
  → human Mark complete / Keep open / Add more evidence
```

The completion gate ignores the model's proposed status when computing the application result:

- every required criterion with an exact verified quote and no uncertainty → `appears_complete`;
- a strict near match, ambiguity, or incomplete proposed match → `needs_human_review`;
- a missing required criterion, unsupported quote, or generic unsupported receipt → `not_verified`.

`appears_complete` never changes the Action Item. The Dexie repository changes status only inside the explicit `Mark complete` transaction. `Keep open` preserves `confirmed`; `Add more evidence` leaves earlier checks in history.

Dexie schema version 2 adds completion checks. Existing proof-linked actions without criteria receive one conservative migration criterion that requires evidence explicitly confirming the saved action text.

The weak and strong built-in fixtures are synthetic and run through the same completion gate as live proposals. The weak generic receipt cannot become `appears_complete`; the strong named receipt still waits for human closure.

## Stage 4 Action Inbox

The IndexedDB repository returns both `confirmed` and `completed` actions. `lib/inbox/group-actions.ts` is a pure presentation layer that groups them as:

- **Today:** overdue actions plus actions due on the current calendar date in each action's IANA timezone;
- **Upcoming:** future-dated and undated confirmed actions;
- **Completed:** actions explicitly closed by the human Proof of Done decision.

Completed actions therefore remain visible after closure. Grouping never changes status. Due state is computed on load and displayed as `Overdue`, `Due today`, `Upcoming`, or `No date supplied`; the interface does not promise push notifications.

Action details display due date, source verification, ambiguity, local status, completion criteria, and completion-check history. Permanent deletion requires a second explicit click and removes the Action Item and its completion checks in one IndexedDB transaction.

Voice capture was intentionally omitted. The required inbox and proof loop are complete, while adding recording permissions, temporary audio handling, and another server route would add risk without improving the Stage 4 core outcome.

## Stage 5 evaluation and hardening

Eight synthetic fixtures pair original source text with machine-readable human labels. The manual live runner uses the production structured-output instructions, then passes proposals through the same deterministic claim and completion gates. It persists model proposals, gated results, field-level scores, counts, percentages, model ID, timestamp, pipeline version, and source commit in a unique run directory. It never persists the API key. Earlier runs are not overwritten; `latest.json` and `latest.md` are generated pointers to the most recent run.

Metric denominators are explicit: action and deadline precision use document fixtures where the gated pipeline emitted those fields; refusal uses document fixtures labelled with no supported deadline; exact-match and escalation use fixtures carrying those positive labels; completion correctness uses the two completion fixtures. Invented factual claims count model-proposed claims whose quotes receive `unsupported` from deterministic matching.

Document and completion text are untrusted data. Shared system instructions prohibit following embedded role changes, tool requests, or output-format demands. The model still cannot assign evidence verification or final completion status. Empty quotes are explicitly unsupported, any human-review signal blocks action confirmation, and only exact deterministic support passes the proof gate.

API routes bound request bytes before Zod field/page/character validation and return generic errors rather than SDK details. Global response headers deny framing, MIME sniffing, camera, microphone, and geolocation, and constrain referrers, base URIs, and form targets. React renders model and document values as text; no unsafe HTML rendering path exists.

GitHub Actions installs from the lockfile and runs formatting, lint, type checking, unit/integration tests, and a production build. Live OpenAI evaluation is intentionally manual so pull requests cannot consume a secret or incur model cost automatically.

### Threat assumptions and limits

- The server and deployment environment are trusted to protect `OPENAI_API_KEY`; browsers and uploaded content are not trusted.
- Same-origin API routes are public demonstration endpoints. Byte limits reduce accidental or simple cost abuse, but there is no authentication, distributed rate limiting, quota, or bot protection.
- Deterministic matching proves that a quote occurs in supplied text, not that the document is authentic, complete, current, or benign.
- Browser-local IndexedDB data inherits the security and retention properties of the browser profile and device.
- Dependency review is required continuously; automated breaking downgrades are not applied without compatibility review.

## Stage 6 experience layer

Stage 6 changes presentation and demo orchestration only. The underlying schemas, refusal gate, deterministic quote matcher, completion gate, and human-controlled persistence transitions are unchanged.

The interface uses one high-contrast white central surface with a deep ink navigation shell. Blue identifies primary actions and the Evidence Bridge connector, amber is reserved for ambiguity and required review, and red is reserved for blocked or unsupported evidence. The responsive Evidence Bridge renders source text, a labeled exact-quote connector, and the proposed Action Card side by side on desktop and in that reading order on mobile.

The built-in judge path uses synthetic deterministic fixtures: a contextual-date refusal, a fully source-verified action, weak completion evidence, and strong completion evidence. Reset deletes only the fixed synthetic Proof of Done action and its history; it does not clear user-created actions. Loading copy maps to real local extraction or combined server analysis/deterministic verification work and never presents a fabricated percentage.

Accessibility protections include a skip link, semantic landmarks and labels, visible focus, 44–48px interactive targets, live status/error regions, text labels alongside colour, reduced-motion handling, responsive source order, and automated axe checks at desktop and mobile widths.
