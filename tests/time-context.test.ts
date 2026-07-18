import { describe, expect, it, vi } from "vitest";
import { getTimeContext } from "@/lib/time-context";

describe("time context", () => {
  it("provides Europe/London context for resolving tomorrow at 10", () => {
    vi.spyOn(Intl, "DateTimeFormat").mockReturnValue({
      resolvedOptions: () => ({ timeZone: "Europe/London", locale: "en-GB" })
    } as Intl.DateTimeFormat);
    const context = getTimeContext(new Date("2026-07-18T09:00:00Z"));
    expect(context).toMatchObject({ timezone: "Europe/London", locale: "en-GB" });
    expect(context.currentDatetime).toMatch(/2026-07-18T/);
  });
});
