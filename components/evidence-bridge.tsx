import type { DocumentAnalysisResult } from "@/lib/schemas";

function SourceExcerpt({ result }: { result: DocumentAnalysisResult }) {
  const evidence = result.evidence.find((item) => item.verificationStatus === "verified");
  const page = result.source.pages.find((item) => item.pageNumber === (evidence?.page ?? 1));
  if (!page) return <p className="muted">No source excerpt available.</p>;
  if (evidence?.charStart == null || evidence.charEnd == null)
    return <p className="source-text">{page.text}</p>;
  return (
    <p className="source-text">
      {page.text.slice(0, evidence.charStart)}
      <mark>{page.text.slice(evidence.charStart, evidence.charEnd)}</mark>
      {page.text.slice(evidence.charEnd)}
    </p>
  );
}

export function EvidenceBridge({ result }: { result: DocumentAnalysisResult }) {
  const primaryEvidence = result.evidence.find((item) => item.kind === "required_action");
  const badge =
    primaryEvidence?.verificationStatus === "verified"
      ? "Source verified"
      : "No supporting source found";
  return (
    <section className="evidence-bridge" aria-labelledby="evidence-heading">
      <div className="bridge-source">
        <p className="eyebrow">Source · {result.source.displayName}</p>
        <h2 id="evidence-heading">Verified excerpt</h2>
        <SourceExcerpt result={result} />
      </div>
      <div className="bridge-arrow" aria-hidden="true">
        →
      </div>
      <div className="bridge-action">
        <span className={`status ${result.canConfirm ? "" : "review"}`}>{badge}</span>
        <h2>{result.requiredAction ?? "No required action found"}</h2>
        <dl className="details">
          <div className="detail">
            <dt>Deadline</dt>
            <dd>
              {result.deadline
                ? new Date(result.deadline).toLocaleString("en-GB")
                : "No stated deadline found"}
            </dd>
          </div>
          <div className="detail">
            <dt>Document</dt>
            <dd>{result.documentType}</dd>
          </div>
          <div className="detail">
            <dt>Explanation</dt>
            <dd>{result.explanation}</dd>
          </div>
        </dl>
        {!result.deadline ? (
          <div className="refusal">
            <strong>No reminder created.</strong>
            <br />
            The source does not support an action deadline.
          </div>
        ) : null}
        {result.evidence.map((item, index) => (
          <div className="claim-row" key={`${item.kind}-${index}`}>
            <span>{item.kind.replaceAll("_", " ")}</span>
            <span className={`verification ${item.verificationStatus}`}>
              {item.verificationStatus === "verified"
                ? "Source verified"
                : item.verificationStatus === "near_match_review"
                  ? "Needs human review"
                  : "No supporting source found"}
            </span>
            <small>{item.verificationReason}</small>
          </div>
        ))}
        {result.blockedClaims.length ? (
          <div className="error">
            <strong>Blocked claims</strong>
            <br />
            {result.blockedClaims.join("; ")}
          </div>
        ) : null}
        {result.conflicts.length ? (
          <div className="error">
            <strong>Conflicting source information</strong>
            <br />
            {result.conflicts.join(" ")}
          </div>
        ) : null}
        {result.clarificationQuestion ? (
          <p className="clarification">
            <strong>Clarification needed:</strong> {result.clarificationQuestion}
          </p>
        ) : null}
      </div>
    </section>
  );
}
