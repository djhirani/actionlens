# ActionLens production deployment runbook

## Vercel project

- Framework: Next.js
- Node.js: use a version satisfying `>=20.9.0`
- Build command: `npm run build`
- Install command: `npm ci`
- Production variables: `OPENAI_API_KEY` and `OPENAI_MODEL`
- Variables are server-only. Never use a `NEXT_PUBLIC_` prefix for the API key.

## Budget and abuse controls

Before sharing the URL:

1. Use a dedicated OpenAI project/API key for ActionLens.
2. Set an appropriate project budget and usage notification thresholds in the OpenAI platform.
3. Restrict or rotate the key after judging if appropriate.
4. Review Vercel function usage. Public API routes have byte/character limits but no distributed rate limiting or authentication.

## Deployment verification

Run against the production URL:

1. Load `/` and confirm the privacy disclosure and both required demo controls.
2. Run the contextual-date refusal; confirm no deadline and disabled confirmation.
3. Run the source-verified fixture and confirm the action.
4. Open `/proof-demo`; run weak then strong evidence and select Mark complete.
5. Open `/inbox`; confirm the action is visible under Completed.
6. Reset all local data.
7. Repeat the complete path three times in a clean browser profile.
8. Confirm `/api/interpret-text` returns a sanitised validation error for an empty JSON request, not an SDK error or secret.
9. Test at desktop and mobile widths.

Record the final production URL, deployment timestamp, commit SHA, and three smoke-run results in `DEPLOYMENT_EVIDENCE.md`.
