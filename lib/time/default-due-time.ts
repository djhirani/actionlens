const EXPLICIT_MIDNIGHT = /\bmidnight\b|\b00(?::?00)?\b|\b12(?::?00)?\s*a\.?m\.?\b/i;

export function applyDefaultDueTime(dueAt: string | null, instruction: string) {
  if (!dueAt || EXPLICIT_MIDNIGHT.test(instruction)) return dueAt;
  return dueAt.replace("T00:00", "T07:00");
}
