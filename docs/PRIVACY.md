# Privacy

## Processing model

ActionLens follows: **extract locally, reason in the cloud, verify deterministically, store minimally**.

For a text-based PDF:

1. The browser validates the file and extracts selectable text locally with PDF.js.
2. The browser computes a SHA-256 hash of normalized text.
3. Extracted page text, not the original PDF, is sent to the ActionLens server route.
4. The server sends the extracted text to OpenAI for structured analysis.
5. Application code verifies proposed evidence quotes against the extracted source.
6. The browser releases its reference to the original `File` after analysis.
7. Nothing is stored until the user explicitly confirms a source-verified action.

## Local retention

Confirmed document actions may store in IndexedDB:

- action fields;
- source display name;
- normalized source hash;
- minimal verified evidence excerpts;
- model and pipeline provenance;
- confirmation status.

ActionLens does not persist:

- original PDF bytes;
- an object URL for the PDF;
- the complete extracted document;
- drafts that the user has not confirmed.

## Cloud disclosure

The application states before analysis that extracted text is sent to OpenAI and that the original file is not saved. It warns users not to submit passwords, payment-card details, secrets, or identity documents to the demonstration.

ActionLens does not claim full on-device AI. It does not log raw document content in application code.

## Completion evidence

Pasted completion text and text-based completion PDFs use the same local extraction, normalization, hashing, and cloud disclosure model. Completion evidence is limited to 3 pages or 30,000 extracted characters.

The full completion source and original completion file remain transient and are not placed in IndexedDB. Each check stores status, criterion explanations, source hash, and human decision. Verified evidence excerpts are stored only when the user explicitly enables **Save verified completion excerpts locally**. Near-match and unsupported model-proposed quotes are never retained, even when that option is enabled.

Completion history does not itself close an action. Only the user's explicit **Mark complete** decision changes action status.

## Action deletion

Deleting an action requires explicit confirmation. The local repository deletes the Action Item and all associated completion checks in one IndexedDB transaction. No remote deletion is needed because ActionLens has no account or cloud database.

## Current limits

- Text-based, unencrypted PDFs only.
- Maximum 5 pages and 50,000 extracted characters.
- Image-only PDFs and OCR are not supported in Stage 2.
- Image completion evidence and screenshots are not supported in Stage 3.
- Local browser storage remains subject to browser storage controls and private-browsing restrictions.

## Security and threat assumptions

Uploaded and pasted content is attacker-controlled. ActionLens sends it only as bounded data under system instructions that explicitly reject embedded commands, role changes, and output-format demands. Model proposals are treated as untrusted too: deterministic code assigns quote status, refuses unsupported deadlines and claims, and recomputes completion status. A whitespace-only quote cannot verify, and a human-review signal prevents confirmation.

The API key is read only in server code or by the explicit local evaluation runner. It is not returned to the browser, written to evaluation results, or logged by application code. API errors are converted to generic user messages. Request-byte, page, extracted-character, and file-size limits constrain accidental disclosure and basic cost abuse.

ActionLens assumes the deployment server and the user's browser/device are trusted. It does not authenticate users, rate-limit across instances, scan documents for malware, establish document authenticity, or promise deletion from OpenAI's systems. Deployment operators must configure OpenAI data handling and retention appropriate to their environment. Public deployment should add infrastructure-level rate limits, quotas, monitoring that excludes document content, and abuse controls.

Security headers prevent framing and disable camera, microphone, and geolocation. Model and source content is rendered by React as text; the application does not use `dangerouslySetInnerHTML`. These controls reduce common web risks but do not replace routine dependency and deployment review.

## Synthetic evaluation retention

Live evaluation uses only visibly marked synthetic demonstration documents. Each run stores raw structured model proposals and deterministic results in a unique repository directory, without credentials. These artifacts are suitable for audit but must not be reused with real personal data. Earlier failing runs remain visible; `latest` contains the final measured run rather than a hand-edited score.
