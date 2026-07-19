"use client";
import { useRef, useState } from "react";
import { EvidenceBridge } from "@/components/evidence-bridge";
import { ScamNotice } from "@/components/scam-notice";
import { getBaitFixtureResult } from "@/lib/demo/bait-fixture";
import { getVerifiedFixtureResult } from "@/lib/demo/verified-fixture";
import { actionRepository } from "@/lib/db";
import { extractPdfText } from "@/lib/documents/extract-pdf";
import { hashSourcePages } from "@/lib/documents/hash";
import { fileToDataUrl, hashFile, isSupportedImage, validateImageFile } from "@/lib/images/input";
import { NO_SCAM_RISK, requestScamCheck } from "@/lib/scam/client";
import {
  ActionItemSchema,
  DocumentAnalysisResultSchema,
  ImageAnalysisResultSchema,
  type ImageAnalysisResult,
  type DocumentAnalysisResult,
  type ScamAssessment
} from "@/lib/schemas";
import { getTimeContext } from "@/lib/time-context";

export function DocumentCheck({
  photoInputEnabled = false,
  scamCheckEnabled = false
}: {
  photoInputEnabled?: boolean;
  scamCheckEnabled?: boolean;
}) {
  const fileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<"pdf" | "image">("pdf");
  const [result, setResult] = useState<DocumentAnalysisResult | null>(null);
  const [imageResult, setImageResult] = useState<ImageAnalysisResult | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "extracting" | "analysing">("idle");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scamAssessment, setScamAssessment] = useState<ScamAssessment>(NO_SCAM_RISK);

  function releaseFile() {
    fileRef.current = null;
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function selectFile(file: File | null) {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    fileRef.current = file;
    setFileName(file?.name ?? null);
    const kind = file && isSupportedImage(file) ? "image" : "pdf";
    setFileKind(kind);
    setPhotoUrl(file && kind === "image" ? URL.createObjectURL(file) : null);
    setSaved(false);
    setError(null);
  }

  function pasteScreenshot(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = Array.from(event.clipboardData.items)
      .find((item) => item.kind === "file" && item.type.startsWith("image/"))
      ?.getAsFile();
    if (!file) {
      setError("Copy a screenshot, then paste it here.");
      return;
    }
    selectFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function clearPhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setImageResult(null);
  }

  async function analyse() {
    const file = fileRef.current;
    if (!file) return;
    setError(null);
    setResult(null);
    setScamAssessment(NO_SCAM_RISK);
    clearPhoto();
    setState("extracting");
    try {
      if (photoInputEnabled && isSupportedImage(file)) {
        validateImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setPhotoUrl(previewUrl);
        const [sourceHash, imageDataUrl] = await Promise.all([hashFile(file), fileToDataUrl(file)]);
        setState("analysing");
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: file.name,
            sourceHash,
            mimeType: file.type,
            imageDataUrl,
            timeContext: getTimeContext()
          })
        });
        const data: unknown = await response.json();
        if (!response.ok)
          throw new Error(
            typeof data === "object" && data && "error" in data
              ? String(data.error)
              : "Photo analysis failed."
          );
        const nextImageResult = ImageAnalysisResultSchema.parse(data);
        const nextAssessment = await requestScamCheck(
          nextImageResult.transcription,
          scamCheckEnabled
        );
        setScamAssessment(nextAssessment);
        if (nextAssessment.scamRisk !== "likely") setImageResult(nextImageResult);
        releaseFile();
        return;
      }
      const pages = await extractPdfText(file);
      const sourceHash = await hashSourcePages(pages);
      const sourceText = pages.map((page) => page.text).join("\n\n");
      setState("analysing");
      const analysisRequest = fetch("/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: file.name,
          sourceHash,
          pages,
          timeContext: getTimeContext()
        })
      });
      const scamRequest = requestScamCheck(sourceText, scamCheckEnabled);
      const [response, nextAssessment] = await Promise.all([analysisRequest, scamRequest]);
      const data: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          typeof data === "object" && data && "error" in data
            ? String(data.error)
            : "Document analysis failed."
        );
      const nextResult = DocumentAnalysisResultSchema.parse(data);
      setScamAssessment(nextAssessment);
      if (nextAssessment.scamRisk !== "likely") setResult(nextResult);
      releaseFile();
    } catch (caught) {
      setError(
        caught instanceof TypeError
          ? "The analysis could not reach ActionLens. Check your connection and try again."
          : caught instanceof Error
            ? caught.message
            : "Document analysis failed."
      );
    } finally {
      setState("idle");
    }
  }

  function loadDemo(kind: "bait" | "verified") {
    setError(null);
    setScamAssessment(NO_SCAM_RISK);
    setSaved(false);
    setFileName(null);
    setResult(
      (kind === "bait"
        ? getBaitFixtureResult()
        : getVerifiedFixtureResult()) as DocumentAnalysisResult
    );
    clearPhoto();
    releaseFile();
    setState("idle");
  }

  async function confirm() {
    if (!result?.canConfirm || !result.requiredAction) return;
    const now = new Date().toISOString();
    const excerpt = result.evidence
      .filter((item) => item.verificationStatus === "verified")
      .map((item) => item.quote)
      .join("\n")
      .slice(0, 2000);
    const action = ActionItemSchema.parse({
      id: crypto.randomUUID(),
      version: 1,
      title: result.requiredAction.slice(0, 100),
      action: result.requiredAction,
      dueAt: result.deadline,
      context: result.explanation,
      status: "draft",
      sourceText: excerpt,
      uncertainty: {
        requiresHumanReview: result.requiresHumanReview,
        reasons: result.conflicts,
        clarificationQuestion: result.clarificationQuestion
      },
      source: {
        kind: "pdf",
        displayName: result.source.displayName,
        sourceHash: result.source.sourceHash,
        retained: false,
        extractedExcerptSaved: true
      },
      proofLink: {
        allRequiredClaimsVerified: result.allRequiredClaimsVerified,
        blockedClaims: result.blockedClaims,
        evidenceQuotes: result.evidence
          .filter((item) => item.verificationStatus === "verified")
          .map((item) => item.quote)
      },
      completionCriteria: result.completionCriteria.map((description, index) => ({
        id: `criterion-${index + 1}`,
        description,
        required: true
      })),
      provenance: {
        model: result.provenance.model,
        pipelineVersion: "stage-2-v1",
        analyzedAt: result.provenance.analyzedAt,
        timezone: getTimeContext().timezone,
        locale: getTimeContext().locale
      },
      createdAt: now,
      updatedAt: now
    });
    await actionRepository.saveConfirmed(action);
    setResult(null);
    setSaved(true);
  }

  async function confirmImage() {
    if (!imageResult?.card) return;
    await actionRepository.saveConfirmed(imageResult.card);
    clearPhoto();
    setSaved(true);
  }

  return (
    <section className="document-workspace" id="document-check" aria-labelledby="document-heading">
      <div className="card document-input">
        <p className="eyebrow">Proof-Linked Actions</p>
        <h2 id="document-heading">Check a document</h2>
        <div className="privacy-sheet" role="note" aria-label="Document privacy">
          <strong>Your document, handled deliberately</strong>
          <ul>
            <li>Text is extracted locally from a text-based PDF.</li>
            {photoInputEnabled ? (
              <li>Photos are sent to OpenAI for transcription and are not saved by ActionLens.</li>
            ) : null}
            <li>Relevant extracted text is sent to OpenAI for analysis.</li>
            <li>The original file is not saved by ActionLens.</li>
            <li>The result is saved locally only after you confirm it.</li>
            <li>
              Do not use passwords, payment-card details, secrets, or identity documents in this
              demo.
            </li>
          </ul>
        </div>
        {photoInputEnabled ? (
          <div>
            <label id="attachment-label" htmlFor="document-file">
              Letter, email, text message, or document
            </label>
            <input
              ref={inputRef}
              id="document-file"
              className="visually-hidden-file"
              type="file"
              accept="application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/png,.png,image/heic,.heic,image/webp,.webp"
              disabled={state !== "idle"}
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            />
            <div
              className="attachment-field"
              role="button"
              tabIndex={state === "idle" ? 0 : -1}
              aria-label="Upload attachment or paste screenshot"
              aria-describedby="attachment-help"
              aria-disabled={state !== "idle"}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
              }}
              onPaste={state === "idle" ? pasteScreenshot : undefined}
            >
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Selected attachment preview" />
              ) : (
                <strong>Click to upload, or paste a screenshot</strong>
              )}
              <span id="attachment-help">
                Text-based PDF, JPG, PNG, HEIC, or WebP · Ctrl+V or ⌘V to paste
              </span>
            </div>
          </div>
        ) : (
          <>
            <label htmlFor="document-file">Text-based PDF</label>
            <input
              ref={inputRef}
              id="document-file"
              type="file"
              accept="application/pdf,.pdf"
              disabled={state !== "idle"}
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            />
          </>
        )}
        {fileName ? <p className="hint">Selected: {fileName}</p> : null}
        <div className="actions">
          <button
            className="button primary"
            type="button"
            disabled={!fileName || state !== "idle"}
            onClick={analyse}
          >
            {state === "extracting"
              ? "Extracting locally…"
              : state === "analysing"
                ? "Verifying claims…"
                : "Analyse document"}
          </button>
          <button className="button secondary" type="button" onClick={() => loadDemo("bait")}>
            Try the “No deadline stated” demo
          </button>
          <button className="button ghost" type="button" onClick={() => loadDemo("verified")}>
            Try a source-verified action
          </button>
        </div>
        {state === "extracting" || state === "analysing" ? (
          <div className="work-status" role="status" aria-live="polite">
            <span className="spinner dark" aria-hidden="true" />
            <div>
              <strong>
                {state === "extracting"
                  ? photoInputEnabled && fileKind === "image"
                    ? "Preparing photo…"
                    : "Reading document…"
                  : photoInputEnabled && fileKind === "image"
                    ? "Reading photo and verifying quotes…"
                    : "Verifying quotes and checking risk…"}
              </strong>
              <small>
                {state === "extracting"
                  ? photoInputEnabled && fileKind === "image"
                    ? "The photo will be sent to OpenAI for transcription and is not saved."
                    : "The original PDF stays local and is not saved."
                  : "This model step usually takes several seconds. Keep this page open."}
              </small>
            </div>
          </div>
        ) : null}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="success" role="status">
            Proof-Linked Action confirmed and saved locally.
          </p>
        ) : null}
      </div>
      {scamAssessment.scamRisk === "likely" ? <ScamNotice assessment={scamAssessment} /> : null}
      {result ? (
        <>
          <ScamNotice assessment={scamAssessment} />
          <EvidenceBridge result={result} />
          <div className="card result-actions">
            <button
              className="button primary"
              type="button"
              disabled={!result.canConfirm}
              onClick={confirm}
            >
              Confirm Proof-Linked Action
            </button>
            {!result.canConfirm ? (
              <p className="muted">
                Confirmation is blocked until every required claim is source verified and conflicts
                are resolved.
              </p>
            ) : null}
            <button className="button ghost" type="button" onClick={() => setResult(null)}>
              Discard
            </button>
          </div>
        </>
      ) : null}
      {imageResult ? (
        imageResult.readConfidence === "low" ? (
          <section className="card photo-escalation" role="status">
            <p className="eyebrow">Photo needs another look</p>
            <h2>We couldn’t read this photo reliably.</h2>
            <p>Please take a clearer photo with the whole letter in focus and try again.</p>
            <button className="button ghost" type="button" onClick={clearPhoto}>
              Discard
            </button>
          </section>
        ) : imageResult.card && photoUrl ? (
          <>
            <ScamNotice assessment={scamAssessment} />
            <section className="photo-confirmation" aria-labelledby="photo-confirmation-heading">
              <div className="card photo-source">
                <p className="eyebrow">Uploaded photo</p>
                {/* The object URL exists only for this confirmation view and is never persisted. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Uploaded letter to compare with the transcription" />
              </div>
              <div className="card photo-transcription">
                <p className="eyebrow">Transcription</p>
                <h2 id="photo-confirmation-heading">Check every important detail</h2>
                <p className="source-text">{imageResult.transcription}</p>
              </div>
            </section>
            <section className="card photo-card">
              <span className="status review photo-source-badge">
                Read from photo — no original text layer. Check the transcription before confirming.
              </span>
              <h2>{imageResult.card.title}</h2>
              <p>{imageResult.card.action}</p>
              <dl className="details">
                <div className="detail">
                  <dt>Deadline</dt>
                  <dd>
                    {imageResult.card.dueAt
                      ? new Date(imageResult.card.dueAt).toLocaleString("en-GB")
                      : "No stated deadline found"}
                  </dd>
                </div>
                <div className="detail">
                  <dt>Evidence</dt>
                  <dd>{imageResult.card.proofLink?.evidenceQuotes.join(" · ")}</dd>
                </div>
              </dl>
              <div className="actions">
                <button className="button primary" type="button" onClick={confirmImage}>
                  Transcription is correct — save action
                </button>
                <button className="button ghost" type="button" onClick={clearPhoto}>
                  Discard
                </button>
              </div>
            </section>
          </>
        ) : (
          <section className="card photo-escalation" role="alert">
            <h2>No supporting source found.</h2>
            <p>The proposed card contained evidence that was absent from the transcription.</p>
            <button className="button ghost" type="button" onClick={clearPhoto}>
              Discard
            </button>
          </section>
        )
      ) : null}
    </section>
  );
}
