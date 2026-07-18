"use client";
import { useEffect, useState } from "react";
import { ProofOfDone } from "@/components/proof-of-done";
import { actionRepository, completionRepository } from "@/lib/db";
import { PROOF_DEMO_ACTION } from "@/lib/demo/proof-fixtures";
import type { CompletionCheck } from "@/lib/schemas";
import { DemoReset } from "@/components/demo-reset";

export function ProofDemo() {
  const [history, setHistory] = useState<CompletionCheck[] | null>(null);
  useEffect(() => {
    actionRepository
      .saveConfirmed(PROOF_DEMO_ACTION)
      .then(() => completionRepository.listForAction(PROOF_DEMO_ACTION.id))
      .then(setHistory);
  }, []);
  if (!history)
    return (
      <p className="muted" role="status">
        Preparing synthetic Proof of Done demo…
      </p>
    );
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Synthetic demonstration</p>
        <h1>Try Proof of Done</h1>
        <p className="lede">
          Compare a generic upload receipt with a confirmation that names the required sponsorship
          document.
        </p>
        <div className="demo-steps" aria-label="Proof of Done demo steps">
          <span>
            <b>1</b> Try weak evidence
          </span>
          <span>
            <b>2</b> Try strong evidence
          </span>
          <span>
            <b>3</b> Mark complete
          </span>
          <span>
            <b>4</b> View in Inbox
          </span>
        </div>
        <DemoReset reloadAfter />
      </section>
      <ProofOfDone action={PROOF_DEMO_ACTION} initialHistory={history} demo />
    </>
  );
}
