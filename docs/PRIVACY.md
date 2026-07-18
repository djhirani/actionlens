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

## Current limits

- Text-based, unencrypted PDFs only.
- Maximum 5 pages and 50,000 extracted characters.
- Image-only PDFs and OCR are not supported in Stage 2.
- Image completion evidence and screenshots are not supported in Stage 3.
- Local browser storage remains subject to browser storage controls and private-browsing restrictions.
