"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { actionRepository } from "@/lib/db";
import { dueLabel, getDueState, groupActions, type InboxGroup } from "@/lib/inbox/group-actions";
import type { ActionItem } from "@/lib/schemas";

const tabs: Array<{ id: InboxGroup; label: string }> = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" }
];

function ActionRow({ action }: { action: ActionItem }) {
  const state = getDueState(action);
  return (
    <li className="card inbox-item">
      <div className="inbox-badges">
        <span className={`status due-${state}`}>{dueLabel(action)}</span>
        {action.source?.kind === "image" ? (
          <span className="status review">Read from photo — human-checked transcription</span>
        ) : action.proofLink?.allRequiredClaimsVerified ? (
          <span className="status source-status">Source verified</span>
        ) : (
          <span className="status">Human confirmed</span>
        )}
        {action.uncertainty.requiresHumanReview ? (
          <span className="status review">Needs human review</span>
        ) : null}
      </div>
      <h2>{action.title}</h2>
      <p>{action.action}</p>
      <dl className="inbox-meta">
        <div>
          <dt>Due</dt>
          <dd>
            {action.dueAt
              ? new Intl.DateTimeFormat(action.provenance.locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: action.provenance.timezone
                }).format(new Date(action.dueAt))
              : "No date supplied"}
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{action.status === "completed" ? "Completed by you" : "Open"}</dd>
        </div>
      </dl>
      <Link className="button secondary inline-button" href={`/actions/${action.id}`}>
        Open action
      </Link>
    </li>
  );
}

export function ActionInbox() {
  const [actions, setActions] = useState<ActionItem[] | null>(null);
  const [activeTab, setActiveTab] = useState<InboxGroup>("today");
  const [error, setError] = useState(false);
  useEffect(() => {
    actionRepository
      .listInbox()
      .then(setActions)
      .catch(() => setError(true));
  }, []);
  const groups = useMemo(() => groupActions(actions ?? []), [actions]);
  if (error)
    return (
      <p className="error" role="alert">
        The local Action Inbox is unavailable.
      </p>
    );
  if (!actions)
    return (
      <p className="muted" role="status">
        Loading local actions…
      </p>
    );
  return (
    <section>
      <div className="inbox-summary" aria-live="polite">
        <strong>{groups.today.filter((action) => getDueState(action) === "overdue").length}</strong>{" "}
        overdue ·{" "}
        <strong>
          {groups.today.filter((action) => getDueState(action) === "due_today").length}
        </strong>{" "}
        due today
      </div>
      <div className="inbox-tabs" role="tablist" aria-label="Action Inbox groups">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            <span>{groups[tab.id].length}</span>
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        aria-label={`${tabs.find((tab) => tab.id === activeTab)?.label} actions`}
      >
        {groups[activeTab].length ? (
          <ul className="inbox-list">
            {groups[activeTab].map((action) => (
              <ActionRow action={action} key={action.id} />
            ))}
          </ul>
        ) : (
          <section className="card empty-state">
            <h2>No {activeTab} actions</h2>
            <p className="muted">
              {activeTab === "completed"
                ? "Actions you mark complete will remain visible here."
                : activeTab === "today"
                  ? "Nothing is overdue or due today."
                  : "Future and undated confirmed actions will appear here."}
            </p>
          </section>
        )}
      </div>
    </section>
  );
}
