import type { ActionItem } from "@/lib/schemas";

export type InboxGroup = "today" | "upcoming" | "completed";
export type DueState = "overdue" | "due_today" | "upcoming" | "no_date" | "completed";

function dateKey(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function getDueState(action: ActionItem, now = new Date()): DueState {
  if (action.status === "completed") return "completed";
  if (!action.dueAt) return "no_date";
  const due = new Date(action.dueAt);
  if (dateKey(due, action.provenance.timezone) === dateKey(now, action.provenance.timezone))
    return "due_today";
  return due.getTime() < now.getTime() ? "overdue" : "upcoming";
}

export function groupActions(actions: ActionItem[], now = new Date()) {
  const groups: Record<InboxGroup, ActionItem[]> = { today: [], upcoming: [], completed: [] };
  for (const action of actions) {
    const dueState = getDueState(action, now);
    if (dueState === "completed") groups.completed.push(action);
    else if (dueState === "overdue" || dueState === "due_today") groups.today.push(action);
    else groups.upcoming.push(action);
  }
  groups.today.sort((left, right) => (left.dueAt ?? "").localeCompare(right.dueAt ?? ""));
  groups.upcoming.sort((left, right) => {
    if (!left.dueAt) return 1;
    if (!right.dueAt) return -1;
    return left.dueAt.localeCompare(right.dueAt);
  });
  groups.completed.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  return groups;
}

export function dueLabel(action: ActionItem, now = new Date()) {
  const state = getDueState(action, now);
  if (state === "completed") return "Completed";
  if (state === "overdue") return "Overdue";
  if (state === "due_today") return "Due today";
  if (state === "no_date") return "No date supplied";
  return "Upcoming";
}
