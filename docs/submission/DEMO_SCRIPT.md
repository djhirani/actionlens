# ActionLens narrated demo — target 2:40

Use a clean browser profile at the production URL. Turn on recording captions, zoom to 100%, close unrelated tabs, and reset synthetic demo data before recording. Use voiceover only; do not add copyrighted music.

## 0:00–0:18 — Problem

On screen: ActionLens home and the “See the source. Trust the action.” heading.

> Important actions are often buried in administrative documents. A fluent AI summary can still attach the wrong date to a task or make weak proof sound conclusive. ActionLens keeps the source, the action, and the human decision connected.

## 0:18–0:43 — Refuse the bait

Click **Try the “No deadline stated” demo**.

> This synthetic notice mentions 30 July, but only as an office training date. ActionLens shows the source and refuses to convert that contextual date into an action deadline. No reminder is created, and confirmation stays blocked.

On screen: source text, “No stated deadline found,” red refusal panel, disabled confirmation.

## 0:43–1:08 — Verify a real claim

Click **Try a source-verified action**.

> Here the document explicitly requires a sponsorship confirmation upload by 24 July. GPT-5.6 proposes structured claims. Deterministic application code finds each exact quote in the source, then the Evidence Bridge shows why the Action Card is verified.

Click **Confirm Proof-Linked Action**.

> Nothing is stored until the user confirms it.

## 1:08–1:49 — Weak and strong Proof of Done

Click **Try Proof of Done**, then **Try weak evidence**.

> A generic “File uploaded successfully” receipt does not name sponsorship confirmation. ActionLens returns Not verified and disables Mark complete.

Click **Try strong evidence**.

> This confirmation names the required document and matches the criterion, so it appears complete. That is still advisory: the app cannot confirm official acceptance, and only the user can close the action.

Click **Mark complete**.

## 1:49–2:08 — Inbox and local history

Open **Action Inbox**, select **Completed**, and open the action.

> Completed actions remain visible with their local proof history. Confirmed actions and minimal proof metadata live in browser IndexedDB; original files are not retained.

## 2:08–2:29 — Architecture and measurement

On screen: briefly show the README Proof Loop and measured-results table.

> GPT-5.6 handles structured interpretation and evidence comparison. It never awards the verified badge or changes status directly. Eight synthetic adversarial fixtures measured deadline refusal, exact evidence, ambiguity escalation, and completion correctness; the final controlled run passed eight of eight with zero unsupported factual claims.

## 2:29–2:40 — Codex and close

On screen: README Codex section and build history.

> Codex built the app, proof gates, tests, eval pipeline, security hardening, and submission evidence in the primary Build Week thread. ActionLens does not just tell you what to do. It shows the proof, refuses unsupported claims, and leaves closure with you.

End card: ActionLens name, live URL, repository URL, “Synthetic demo — no personal information.”

## Exact click path

1. Home → **Reset demo data**.
2. **Try the “No deadline stated” demo**.
3. **Try a source-verified action** → **Confirm Proof-Linked Action**.
4. **Try Proof of Done** → **Try weak evidence**.
5. **Try strong evidence** → **Mark complete**.
6. **Action Inbox** → **Completed** → **Open action**.
7. Return home and reset before another take.
