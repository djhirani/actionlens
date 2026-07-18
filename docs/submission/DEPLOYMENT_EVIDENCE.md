# Deployment evidence

- Production URL: <https://actionlens-five.vercel.app>
- Immutable deployment URL: <https://actionlens-2kvx93uu7-hirani.vercel.app>
- Vercel project: `hirani/actionlens`
- Deployment ID: `dpl_FqcEms8E9pAdGFHSQZw6H8MpkVju`
- Deployment source: Stage 7 verified working tree based on commit `d229047`; product code matches approved Stage 6 commit `9bad061`
- Deployment timestamp: `2026-07-18T09:15:35Z`
- Verification timestamp: `2026-07-18T09:20:08Z`
- Vercel state: `READY`, target `production`
- Environment values: configured server-side; values intentionally not recorded
- Git integration: pending access fix because the GitHub repository is private

## Live smoke runs

| Run | Refusal | Verified action | Weak proof | Strong proof | Human closure | Completed inbox |
| --: | ------- | --------------- | ---------- | ------------ | ------------- | --------------- |
|   1 | PASS    | PASS            | PASS       | PASS         | PASS          | PASS            |
|   2 | PASS    | PASS            | PASS       | PASS         | PASS          | PASS            |
|   3 | PASS    | PASS            | PASS       | PASS         | PASS          | PASS            |

Production API validation/sanitisation check: **PASS**. An empty JSON request returned HTTP 400 with the documented generic message and exposed no SDK error or secret.
