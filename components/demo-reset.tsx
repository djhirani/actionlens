"use client";
import { useState } from "react";
import { actionRepository } from "@/lib/db";
import { PROOF_DEMO_ACTION } from "@/lib/demo/proof-fixtures";

export function DemoReset({ reloadAfter = false }: { reloadAfter?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function reset() {
    setState("busy");
    try {
      await actionRepository.deleteById(PROOF_DEMO_ACTION.id);
      if (reloadAfter) {
        window.location.reload();
        return;
      }
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="demo-reset">
      <button className="button ghost" type="button" disabled={state === "busy"} onClick={reset}>
        {state === "busy" ? "Resetting demo…" : "Reset demo data"}
      </button>
      {state === "done" ? (
        <span className="reset-status" role="status">
          Synthetic demo action and proof history cleared.
        </span>
      ) : null}
      {state === "error" ? (
        <span className="reset-error" role="alert">
          Demo data could not be reset.
        </span>
      ) : null}
    </div>
  );
}
