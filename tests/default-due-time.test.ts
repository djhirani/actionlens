import { describe, expect, it } from "vitest";
import { applyDefaultDueTime } from "@/lib/time/default-due-time";

describe("date-only default time", () => {
  it("moves an inferred midnight deadline to 07:00", () => {
    expect(applyDefaultDueTime("2026-08-01T00:00:00+01:00", "Call on 1 August")).toBe(
      "2026-08-01T07:00:00+01:00"
    );
  });

  it.each(["Call at midnight", "Call at 00:00", "Call at 12 a.m."])(
    "preserves explicitly requested midnight: %s",
    (instruction) => {
      expect(applyDefaultDueTime("2026-08-01T00:00:00+01:00", instruction)).toBe(
        "2026-08-01T00:00:00+01:00"
      );
    }
  );

  it("preserves an explicitly resolved non-midnight time", () => {
    expect(applyDefaultDueTime("2026-08-01T14:30:00+01:00", "Call at 2:30 pm")).toBe(
      "2026-08-01T14:30:00+01:00"
    );
  });
});
