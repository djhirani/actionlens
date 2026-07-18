"use client";
import { useRef, useState } from "react";
import { completionRepository } from "@/lib/db";
import { extractCompletionPdfText } from "@/lib/documents/extract-pdf";
import { hashSourcePages } from "@/lib/documents/hash";
import { getStrongProofResult, getWeakProofResult } from "@/lib/demo/proof-fixtures";
import {
  CompletionAnalysisResultSchema,
  type ActionItem,
  type CompletionAnalysisResult,
  type CompletionCheck,
  type SourcePage
} from "@/lib/schemas";
import { getTimeContext } from "@/lib/time-context";

const statusLabel = {
  appears_complete: "Appears complete",
  needs_human_review: "Needs human review",
  not_verified: "Not verified"
} as const;

export function ProofOfDone({
  action,
  initialHistory,
  demo = false,
  onStatusChange
}: {
  action: ActionItem;
  initialHistory: CompletionCheck[];
  demo?: boolean;
  onStatusChange?: (action: ActionItem) => void;
}) {
  const fileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [saveExcerpts, setSaveExcerpts] = useState(false);
  const [result, setResult] = useState<CompletionAnalysisResult | null>(null);
  const [history, setHistory] = useState(initialHistory);
  const [status, setStatus] = useState(action.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function releaseFile() {
    fileRef.current = null;
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }
  async function storeResult(next: CompletionAnalysisResult) {
    await completionRepository.savePending(next, saveExcerpts);
    setResult(next);
    setHistory(await completionRepository.listForAction(action.id));
  }
  async function analysePages(pages: SourcePage[], displayName: string) {
    setBusy(true);
    setError(null);
    try {
      const sourceHash = await hashSourcePages(pages);
      const response = await fetch("/api/verify-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          displayName,
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
            : "Completion check failed."
        );
      await storeResult(CompletionAnalysisResultSchema.parse(data));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Completion check failed.");
    } finally {
      setBusy(false);
      releaseFile();
    }
  }
  async function checkPastedText() {
    const value = text.trim();
    if (!value) return;
    await analysePages([{ pageNumber: 1, text: value }], "Pasted completion evidence");
  }
  async function checkPdf() {
    const file = fileRef.current;
    if (!file) return;
    setBusy(true);
    try {
      const pages = await extractCompletionPdfText(file);
      await analysePages(pages, file.name);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Completion PDF could not be read.");
      setBusy(false);
      releaseFile();
    }
  }
  async function loadFixture(kind: "weak" | "strong") {
    setError(null);
    await storeResult(kind === "weak" ? getWeakProofResult() : getStrongProofResult());
  }
  async function decide(decision: "mark_complete" | "keep_open") {
    if (!result) return;
    const updated = await completionRepository.decide(result.id, decision);
    setStatus(updated.action.status);
    onStatusChange?.(updated.action);
    setResult({ ...result, userDecision: decision });
    setHistory(await completionRepository.listForAction(action.id));
  }
  function addMoreEvidence() {
    setResult(null);
    setText("");
    releaseFile();
  }

  return (
    <section className="proof-panel" aria-labelledby="proof-heading">
      <div className="card">
        <p className="eyebrow">Proof of Done</p>
        <h2 id="proof-heading">Check proof of completion</h2>
        <p className="muted">
          Compare later evidence with the confirmed requirement. The original evidence file is not
          saved.
        </p>
        <div className="criteria">
          <strong>Completion criteria</strong>
          <ul>
            {action.completionCriteria.map((criterion) => (
              <li key={criterion.id}>
                {criterion.description}
                {criterion.required ? " (required)" : ""}
              </li>
            ))}
          </ul>
        </div>
        <label htmlFor="completion-text">Paste confirmation text</label>
        <textarea
          id="completion-text"
          maxLength={30000}
          value={text}
          disabled={busy}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste a confirmation message or receipt…"
        />
        <p className="hint">{text.length}/30,000 characters</p>
        <button
          className="button primary"
          type="button"
          disabled={!text.trim() || busy}
          onClick={checkPastedText}
        >
          Check pasted evidence
        </button>
        <div className="proof-divider">or</div>
        <label htmlFor="completion-file">Upload a text-based PDF</label>
        <input
          ref={inputRef}
          id="completion-file"
          type="file"
          accept="application/pdf,.pdf"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            fileRef.current = file;
            setFileName(file?.name ?? null);
          }}
        />
        {fileName ? <p className="hint">Selected: {fileName}</p> : null}
        <button
          className="button secondary"
          type="button"
          disabled={!fileName || busy}
          onClick={checkPdf}
        >
          Check PDF evidence
        </button>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={saveExcerpts}
            onChange={(event) => setSaveExcerpts(event.target.checked)}
          />{" "}
          Save verified completion excerpts locally
        </label>
        {demo ? (
          <div className="actions">
            <button className="button ghost" type="button" onClick={() => loadFixture("weak")}>
              Try weak evidence
            </button>
            <button className="button ghost" type="button" onClick={() => loadFixture("strong")}>
              Try strong evidence
            </button>
          </div>
        ) : null}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      {result ? (
        <section className="card completion-result" aria-live="polite">
          <span className={`status completion-${result.status}`}>{statusLabel[result.status]}</span>
          <h2>{statusLabel[result.status]}</h2>
          <p>{result.explanation}</p>
          {result.matchedCriteria.map((match) => (
            <div className="claim-row" key={match.criterionId}>
              <strong>
                {action.completionCriteria.find((criterion) => criterion.id === match.criterionId)
                  ?.description ?? match.criterionId}
              </strong>
              <span className={`verification ${match.evidence.verificationStatus}`}>
                {match.evidence.verificationStatus === "verified"
                  ? "Source verified"
                  : match.evidence.verificationStatus === "near_match_review"
                    ? "Needs human review"
                    : "Not verified"}
              </span>
              {match.evidence.quote ? <blockquote>“{match.evidence.quote}”</blockquote> : null}
            </div>
          ))}
          {result.missingCriteria.length ? (
            <div className="error">
              <strong>Missing criteria</strong>
              <ul>
                {result.missingCriteria.map((id) => (
                  <li key={id}>
                    {action.completionCriteria.find((criterion) => criterion.id === id)
                      ?.description ?? id}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="disclaimer">{result.disclaimer}</p>
          <div className="actions">
            <button
              className="button primary"
              type="button"
              disabled={result.status !== "appears_complete" || result.userDecision !== "pending"}
              onClick={() => decide("mark_complete")}
            >
              Mark complete
            </button>
            <button
              className="button secondary"
              type="button"
              disabled={result.userDecision !== "pending"}
              onClick={() => decide("keep_open")}
            >
              Keep open
            </button>
            <button className="button ghost" type="button" onClick={addMoreEvidence}>
              Add more evidence
            </button>
          </div>
          {result.userDecision !== "pending" ? (
            <p className="success" role="status">
              Decision recorded:{" "}
              {result.userDecision === "mark_complete" ? "Marked complete" : "Kept open"}.
            </p>
          ) : null}
          <p className="muted">Action status: {status}</p>
        </section>
      ) : null}
      <section className="card">
        <h2>Completion history</h2>
        {history.length ? (
          <ol className="history-list">
            {history.map((check) => (
              <li key={check.id}>
                <strong>{statusLabel[check.status]}</strong> ·{" "}
                {check.userDecision.replaceAll("_", " ")}
                <br />
                <small>
                  {new Date(check.createdAt).toLocaleString("en-GB")} · excerpts{" "}
                  {check.source.excerptsSaved ? "saved" : "not saved"}
                </small>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">No completion checks yet.</p>
        )}
      </section>
    </section>
  );
}
