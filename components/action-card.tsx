"use client";
import type { ActionItem } from "@/lib/schemas";

export function ActionCard({
  action,
  editing,
  onChange
}: {
  action: ActionItem;
  editing: boolean;
  onChange: (next: ActionItem) => void;
}) {
  const update = (field: "title" | "action" | "dueAt" | "context", value: string) =>
    onChange({
      ...action,
      [field]: field === "dueAt" || field === "context" ? value || null : value,
      updatedAt: new Date().toISOString()
    });
  return (
    <article aria-labelledby="draft-title">
      <span className={`status ${action.uncertainty.requiresHumanReview ? "review" : ""}`}>
        {action.uncertainty.requiresHumanReview ? "Needs human review" : "Draft — not saved"}
      </span>
      <h2 id="draft-title">Review this action</h2>
      {editing ? (
        <div className="details">
          <label>
            Title
            <input
              value={action.title}
              maxLength={100}
              onChange={(event) => update("title", event.target.value)}
            />
          </label>
          <label>
            Action
            <textarea
              value={action.action}
              maxLength={500}
              onChange={(event) => update("action", event.target.value)}
            />
          </label>
          <label>
            Due date and time
            <input
              type="datetime-local"
              value={action.dueAt?.slice(0, 16) ?? ""}
              onChange={(event) =>
                update(
                  "dueAt",
                  event.target.value ? new Date(event.target.value).toISOString() : ""
                )
              }
            />
          </label>
          <label>
            Context
            <input
              value={action.context ?? ""}
              maxLength={500}
              onChange={(event) => update("context", event.target.value)}
            />
          </label>
        </div>
      ) : (
        <dl className="details">
          <div className="detail">
            <dt>Title</dt>
            <dd>{action.title}</dd>
          </div>
          <div className="detail">
            <dt>Required action</dt>
            <dd>{action.action}</dd>
          </div>
          <div className="detail">
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
          {action.context ? (
            <div className="detail">
              <dt>Context</dt>
              <dd>{action.context}</dd>
            </div>
          ) : null}
        </dl>
      )}
      {action.uncertainty.reasons.length ? (
        <div className="error" role="note">
          {action.uncertainty.reasons.join(" ")}
          {action.uncertainty.clarificationQuestion
            ? ` ${action.uncertainty.clarificationQuestion}`
            : ""}
        </div>
      ) : null}
    </article>
  );
}
