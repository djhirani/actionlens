"use client";
import { useEffect, useState } from "react";
import { actionRepository } from "@/lib/db";
import type { ActionItem } from "@/lib/schemas";

export function ActionInbox() {
  const [actions, setActions] = useState<ActionItem[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    actionRepository
      .listConfirmed()
      .then(setActions)
      .catch(() => setError(true));
  }, []);
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
  if (!actions.length)
    return (
      <section className="card">
        <h2>No confirmed actions</h2>
        <p className="muted">Prepare an action on Home, then confirm it to save it here.</p>
      </section>
    );
  return (
    <ul className="inbox-list">
      {actions.map((action) => (
        <li className="card inbox-item" key={action.id}>
          <span className="status">Confirmed</span>
          <h2>{action.title}</h2>
          <p>{action.action}</p>
          <p className="muted">
            {action.dueAt
              ? new Intl.DateTimeFormat(action.provenance.locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: action.provenance.timezone
                }).format(new Date(action.dueAt))
              : "No date supplied"}
          </p>
        </li>
      ))}
    </ul>
  );
}
