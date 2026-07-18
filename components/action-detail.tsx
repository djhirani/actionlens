"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProofOfDone } from "@/components/proof-of-done";
import { actionRepository, completionRepository } from "@/lib/db";
import type { ActionItem, CompletionCheck } from "@/lib/schemas";

export function ActionDetail() {
  const { id } = useParams<{ id: string }>();
  const [action, setAction] = useState<ActionItem | null | undefined>(undefined);
  const [history, setHistory] = useState<CompletionCheck[]>([]);
  useEffect(() => {
    Promise.all([actionRepository.getById(id), completionRepository.listForAction(id)])
      .then(([nextAction, nextHistory]) => {
        setAction(nextAction);
        setHistory(nextHistory);
      })
      .catch(() => setAction(null));
  }, [id]);
  if (action === undefined)
    return (
      <p className="muted" role="status">
        Loading action…
      </p>
    );
  if (!action)
    return (
      <p className="error" role="alert">
        This local action was not found.
      </p>
    );
  return (
    <>
      <section className="card">
        <span className="status">{action.status}</span>
        <h1 className="detail-title">{action.title}</h1>
        <p className="lede">{action.action}</p>
        {action.proofLink ? (
          <p>
            <strong>Source verified</strong> · {action.source?.displayName}
          </p>
        ) : null}
      </section>
      {action.source?.kind === "pdf" && action.completionCriteria.length ? (
        <ProofOfDone action={action} initialHistory={history} />
      ) : (
        <section className="card">
          <h2>Proof of Done unavailable</h2>
          <p className="muted">
            This action was not created from a proof-linked document with explicit completion
            criteria.
          </p>
        </section>
      )}
    </>
  );
}
