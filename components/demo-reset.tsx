"use client";
import { useState } from "react";
import { actionRepository } from "@/lib/db";

export function DemoReset({ reloadAfter = false }: { reloadAfter?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function reset() {
    setState("busy");
    try {
      await actionRepository.clear();
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
        {state === "busy" ? "Resetting local data…" : "Reset all local data"}
      </button>
      {state === "done" ? (
        <span className="reset-status" role="status">
          All local actions and proof history cleared.
        </span>
      ) : null}
      {state === "error" ? (
        <span className="reset-error" role="alert">
          Local data could not be reset.
        </span>
      ) : null}
    </div>
  );
}
