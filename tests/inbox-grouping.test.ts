import { describe, expect, it } from "vitest";
import { dueLabel, getDueState, groupActions } from "@/lib/inbox/group-actions";
import { actionFixture } from "./helpers";

const now = new Date("2026-07-18T12:00:00Z");

describe("Action Inbox grouping", () => {
  it("groups overdue and due-today actions under Today", () => {
    const overdue = actionFixture({
      id: "11111111-1111-4111-8111-111111111111",
      dueAt: "2026-07-17T10:00:00+01:00",
      status: "confirmed"
    });
    const today = actionFixture({
      id: "22222222-2222-4222-8222-222222222222",
      dueAt: "2026-07-18T18:00:00+01:00",
      status: "confirmed"
    });
    const groups = groupActions([overdue, today], now);
    expect(groups.today).toHaveLength(2);
    expect(getDueState(overdue, now)).toBe("overdue");
    expect(dueLabel(today, now)).toBe("Due today");
  });
  it("groups future and undated open actions under Upcoming", () => {
    const future = actionFixture({
      id: "33333333-3333-4333-8333-333333333333",
      dueAt: "2026-07-20T10:00:00+01:00",
      status: "confirmed"
    });
    const undated = actionFixture({
      id: "44444444-4444-4444-8444-444444444444",
      dueAt: null,
      status: "confirmed"
    });
    expect(groupActions([future, undated], now).upcoming.map((action) => action.id)).toEqual([
      future.id,
      undated.id
    ]);
  });
  it("keeps completed actions visible only in Completed", () => {
    const completed = actionFixture({ status: "completed" });
    const groups = groupActions([completed], now);
    expect(groups.completed).toEqual([completed]);
    expect(groups.today).toHaveLength(0);
    expect(groups.upcoming).toHaveLength(0);
  });
  it("uses each action's IANA timezone for today's date", () => {
    const london = actionFixture({
      status: "confirmed",
      dueAt: "2026-07-19T00:30:00+01:00",
      provenance: { ...actionFixture().provenance, timezone: "Europe/London" }
    });
    const beforeMidnightUtc = new Date("2026-07-18T23:45:00Z");
    expect(getDueState(london, beforeMidnightUtc)).toBe("due_today");
  });
});
