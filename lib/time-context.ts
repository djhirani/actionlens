import type { z } from "zod";
import { TimeContextSchema } from "@/lib/schemas";

export type TimeContext = z.infer<typeof TimeContextSchema>;

function isoWithLocalOffset(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const pad = (value: number) => String(Math.abs(value)).padStart(2, "0");
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, -1);
  return `${local}${sign}${pad(Math.trunc(offsetMinutes / 60))}:${pad(offsetMinutes % 60)}`;
}

export function getTimeContext(now = new Date()): TimeContext {
  const resolved = Intl.DateTimeFormat().resolvedOptions();
  return TimeContextSchema.parse({
    currentDatetime: isoWithLocalOffset(now),
    timezone: resolved.timeZone,
    locale: resolved.locale
  });
}
