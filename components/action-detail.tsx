"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ProofOfDone } from "@/components/proof-of-done";
import { actionRepository, completionRepository } from "@/lib/db";
import type { ActionItem, CompletionCheck } from "@/lib/schemas";
import { dueLabel, getDueState } from "@/lib/inbox/group-actions";

export function ActionDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [action, setAction] = useState<ActionItem | null | undefined>(undefined);
  const [history, setHistory] = useState<CompletionCheck[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
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
  const dueState = getDueState(action);
  async function deleteAction() {
    if (!action) return;
    try {
      await actionRepository.deleteById(action.id);
      router.push("/inbox");
    } catch {
      setDeleteError(true);
    }
  }
  return (
    <>
      <section className="card">
        <div className="inbox-badges">
          <span className={`status due-${dueState}`}>{dueLabel(action)}</span>
          {action.proofLink?.allRequiredClaimsVerified ? (
            <span className="status source-status">Source verified</span>
          ) : (
            <span className="status">Human confirmed</span>
          )}
          {action.uncertainty.requiresHumanReview ? (
            <span className="status review">Needs human review</span>
          ) : null}
        </div>
        <h1 className="detail-title">{action.title}</h1>
        <p className="lede">{action.action}</p>
        {action.proofLink ? (
          <p>
            <strong>Source verified</strong> · {action.source?.displayName}
          </p>
        ) : null}
        <dl className="inbox-meta">
          <div>
            <dt>Due</dt>
            <dd>
              {action.dueAt
                ? new Intl.DateTimeFormat(action.provenance.locale, {
                    dateStyle: "full",
                    timeStyle: "short",
                    timeZone: action.provenance.timezone
                  }).format(new Date(action.dueAt))
                : "No date supplied"}
            </dd>
          </div>
          <div>
            <dt>Local status</dt>
            <dd>{action.status === "completed" ? "Completed by you" : "Open"}</dd>
          </div>
        </dl>
      </section>
      {action.source?.kind === "pdf" && action.completionCriteria.length ? (
        <ProofOfDone action={action} initialHistory={history} onStatusChange={setAction} />
      ) : (
        <section className="card">
          <h2>Proof of Done unavailable</h2>
          <p className="muted">
            This action was not created from a proof-linked document with explicit completion
            criteria.
          </p>
        </section>
      )}
      <section className="card danger-zone">
        <h2>Delete local action</h2>
        <p className="muted">
          Deletes this action and its completion-check history from this browser.
        </p>
        {confirmDelete ? (
          <div className="actions">
            <button className="button danger" type="button" onClick={deleteAction}>
              Delete permanently
            </button>
            <button className="button ghost" type="button" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="button ghost" type="button" onClick={() => setConfirmDelete(true)}>
            Delete action
          </button>
        )}
        {deleteError ? (
          <p className="error" role="alert">
            The action could not be deleted.
          </p>
        ) : null}
      </section>
    </>
  );
}
