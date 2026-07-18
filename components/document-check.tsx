"use client";
import { useRef, useState } from "react";
import { EvidenceBridge } from "@/components/evidence-bridge";
import { getBaitFixtureResult } from "@/lib/demo/bait-fixture";
import { getVerifiedFixtureResult } from "@/lib/demo/verified-fixture";
import { actionRepository } from "@/lib/db";
import { extractPdfText } from "@/lib/documents/extract-pdf";
import { hashSourcePages } from "@/lib/documents/hash";
import {
  ActionItemSchema,
  DocumentAnalysisResultSchema,
  type DocumentAnalysisResult
} from "@/lib/schemas";
import { getTimeContext } from "@/lib/time-context";

export function DocumentCheck() {
  const fileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentAnalysisResult | null>(null);
  const [state, setState] = useState<"idle" | "extracting" | "analysing" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  function releaseFile() {
    fileRef.current = null;
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function analyse() {
    const file = fileRef.current;
    if (!file) return;
    setError(null);
    setResult(null);
    setState("extracting");
    try {
      const pages = await extractPdfText(file);
      const sourceHash = await hashSourcePages(pages);
      setState("analysing");
      const response = await fetch("/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: file.name,
          sourceHash,
          pages,
          timeContext: getTimeContext()
        })
      });
      const data: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          typeof data === "object" && data && "error" in data
            ? String(data.error)
            : "Document analysis failed."
        );
      setResult(DocumentAnalysisResultSchema.parse(data));
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
    setFileName(null);
    setResult(
      (kind === "bait"
        ? getBaitFixtureResult()
        : getVerifiedFixtureResult()) as DocumentAnalysisResult
    );
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
    setState("saved");
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
            <li>Relevant extracted text is sent to OpenAI for analysis.</li>
            <li>The original file is not saved by ActionLens.</li>
            <li>The result is saved locally only after you confirm it.</li>
            <li>
              Do not use passwords, payment-card details, secrets, or identity documents in this
              demo.
            </li>
          </ul>
        </div>
        <label htmlFor="document-file">Text-based PDF</label>
        <input
          ref={inputRef}
          id="document-file"
          type="file"
          accept="application/pdf,.pdf"
          disabled={state !== "idle"}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            fileRef.current = file;
            setFileName(file?.name ?? null);
            setError(null);
          }}
        />
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
                  ? "Extracting text in this browser"
                  : "Analysing claims and verifying exact quotes"}
              </strong>
              <small>
                {state === "extracting"
                  ? "The original PDF stays local and is not saved."
                  : "Extracted text is sent to OpenAI; deterministic code checks the response."}
              </small>
            </div>
          </div>
        ) : null}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        {state === "saved" ? (
          <p className="success" role="status">
            Proof-Linked Action confirmed and saved locally.
          </p>
        ) : null}
      </div>
      {result ? (
        <>
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
    </section>
  );
}
