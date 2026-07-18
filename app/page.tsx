import { ActionCapture } from "@/components/action-capture";
import { DocumentCheck } from "@/components/document-check";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="main">
      <section className="hero">
        <p className="eyebrow">Human-confirmed action capture</p>
        <h1>Turn an instruction into a clear next step.</h1>
        <p className="lede">
          ActionLens prepares an editable draft using your local time. Review it before anything is
          saved.
        </p>
      </section>
      <ActionCapture />
      <DocumentCheck />
      <section className="card proof-demo-callout">
        <p className="eyebrow">Completion evidence</p>
        <h2>See weak proof rejected</h2>
        <p className="muted">
          Compare a generic upload receipt with a confirmation that names the required document.
        </p>
        <Link className="button secondary inline-button" href="/proof-demo">
          Try Proof of Done
        </Link>
      </section>
    </main>
  );
}
