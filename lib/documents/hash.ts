import { normalizeText } from "@/lib/documents/normalize";
import type { SourcePage } from "@/lib/schemas";

export async function hashSourcePages(pages: SourcePage[]) {
  const normalized = pages.map((page) => normalizeText(page.text)).join("\n\f\n");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
