import { ActionCapture } from "@/components/action-capture";
import { DocumentCheck } from "@/components/document-check";
import { DemoReset } from "@/components/demo-reset";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="main">
      <section className="hero">
        <p className="eyebrow">Proof-linked action capture</p>
        <h1>See the source. Trust the action.</h1>
        <p className="lede">
          ActionLens turns everyday instructions into clear next steps, verifies document claims
          against exact source text, and waits for you before saving or closing anything.
        </p>
        <div className="trust-line" aria-label="ActionLens safety model">
          <span>Source linked</span>
          <span>Claims verified</span>
          <span>Human confirmed</span>
        </div>
      </section>
      <section className="judge-path" aria-labelledby="judge-path-heading">
        <div>
          <p className="eyebrow">30-second judge path</p>
          <h2 id="judge-path-heading">Watch the proof loop refuse, verify, then close.</h2>
          <p>
            Start with a misleading date, inspect a source-verified action, then compare weak and
            strong completion evidence. Every document is synthetic.
          </p>
        </div>
        <div className="judge-actions">
          <a className="button primary" href="#document-check">
            Jump to document demos
          </a>
          <Link className="button secondary" href="/proof-demo">
            Try Proof of Done
          </Link>
        </div>
        <DemoReset />
      </section>
      <ActionCapture />
      <DocumentCheck />
      <section className="card proof-demo-callout">
        <p className="eyebrow">Completion evidence</p>
        <h2>See weak proof rejected</h2>
        <p className="muted">
          Compare a generic upload receipt with a confirmation that names the required document.
        </p>
        <Link className="button primary inline-button" href="/proof-demo">
          Try Proof of Done
        </Link>
      </section>
    </main>
  );
}
