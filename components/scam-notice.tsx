import type { ScamAssessment } from "@/lib/schemas";

export function ScamNotice({ assessment }: { assessment: ScamAssessment }) {
  if (assessment.scamRisk === "none") return null;
  if (assessment.scamRisk === "possible")
    return (
      <aside className="scam-caution" role="note">
        <strong>
          This message shows some signs of a scam — verify the sender through an official channel
          before acting
        </strong>
        {assessment.signals.length ? (
          <ul>
            {assessment.signals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        ) : null}
        <p>The app assesses risk signals; it cannot verify sender authenticity.</p>
      </aside>
    );
  return (
    <section className="card scam-warning" role="alert" aria-labelledby="scam-warning-heading">
      <p className="eyebrow">Safety warning</p>
      <h2 id="scam-warning-heading">Suspected scam — do not pay, do not click, do not reply</h2>
      <p>The app assesses risk signals; it cannot verify sender authenticity.</p>
      {assessment.signals.length ? (
        <div>
          <strong>Risk signals found</strong>
          <ul>
            {assessment.signals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="scam-reporting">
        <strong>How to report (UK)</strong>
        <ul>
          <li>Forward scam texts to 7726.</li>
          <li>Forward scam emails to report@phishing.gov.uk.</li>
          <li>
            If money or details were given, contact your bank immediately and report to Action
            Fraud.
          </li>
        </ul>
      </div>
    </section>
  );
}
