# OpenAI Build Week submission checklist

## Repository

- [x] Final README, licence, build log, measured eval artifacts, and dated Git history present.
- [x] No secret values committed; `.env.local` remains ignored.
- [ ] Owner chooses judge access: make `djhirani/actionlens` public, or grant the rule-compliant private access requested for `testing@devpost.com` and `build-week-event@openai.com`.
- [ ] If keeping it private, verify both judge accounts can open the exact commit and clone the repository.
- [ ] Fix Vercel Git integration access or document that deployment is CLI-managed.

## Vercel and OpenAI

- [x] Vercel project linked as `hirani/actionlens`.
- [x] Production `OPENAI_API_KEY` and `OPENAI_MODEL` configured without recording values.
- [ ] Owner confirms the Vercel account/team is the intended submission owner.
- [ ] Owner sets a dedicated OpenAI project budget and usage alerts.
- [ ] Owner checks production function usage and rotates the key after judging if appropriate.
- [x] Production deploy is READY at `https://actionlens-five.vercel.app`.
- [x] Complete live synthetic path passed three consecutive production runs; API sanitisation smoke passed.

## Video and YouTube

- [x] Under-three-minute narration and exact click path prepared in `DEMO_SCRIPT.md`.
- [ ] Record in a clean browser profile using only synthetic fixtures.
- [ ] Add voiceover and useful on-screen captions; use no copyrighted music.
- [ ] Keep the final video under three minutes and verify text is readable at 1080p.
- [ ] Upload to YouTube with judge-accessible visibility (typically Unlisted unless rules say otherwise).
- [ ] Watch the uploaded video end-to-end and copy the final URL.

## Devpost

- [x] Product-accurate copy and testing instructions prepared in `DEVPOST_COPY.md`.
- [ ] Add the verified production URL, repository URL/access instructions, YouTube URL, final commit SHA, and team details.
- [ ] Paste the exact Codex `/feedback` session ID after generating it.
- [ ] Confirm every claim matches the deployed product and submit before the deadline.

## Codex evidence

- [x] Primary thread ID preserved: `019f72a7-65bd-7071-8682-10b3b216d4af`.
- [x] Build log and dated Git history committed.
- [ ] In this primary thread, run `/feedback`.
- [ ] Copy the exact returned session ID into README, Devpost, and private notes. Do not invent or reformat it.
