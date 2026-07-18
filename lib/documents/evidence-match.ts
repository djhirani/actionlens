import { normalizeText, normalizeTextWithMap } from "@/lib/documents/normalize";
import type { SourcePage } from "@/lib/schemas";

export type VerificationStatus = "verified" | "near_match_review" | "unsupported";
export type EvidenceMatch = {
  quote: string;
  normalizedQuote: string;
  page: number | null;
  charStart: number | null;
  charEnd: number | null;
  verificationStatus: VerificationStatus;
  verificationReason: string;
};

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        (current[rightIndex - 1] ?? 0) + 1,
        (previous[rightIndex] ?? 0) + 1,
        (previous[rightIndex - 1] ?? 0) + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length] ?? Math.max(left.length, right.length);
}

function nearMatch(source: string, quote: string) {
  if (quote.length < 20) return null;
  const quoteWords = quote.split(" ");
  const sourceWords = source.split(" ");
  let best: { text: string; start: number; score: number } | null = null;
  for (let size = Math.max(1, quoteWords.length - 1); size <= quoteWords.length + 1; size += 1) {
    for (let index = 0; index + size <= sourceWords.length; index += 1) {
      const text = sourceWords.slice(index, index + size).join(" ");
      const score = 1 - editDistance(text, quote) / Math.max(text.length, quote.length);
      if (!best || score > best.score) best = { text, start: source.indexOf(text), score };
    }
  }
  return best && best.score >= 0.92 ? best : null;
}

export function matchEvidence(pages: SourcePage[], quote: string): EvidenceMatch {
  const normalizedQuote = normalizeText(quote);
  if (!normalizedQuote) {
    return {
      quote,
      normalizedQuote,
      page: null,
      charStart: null,
      charEnd: null,
      verificationStatus: "unsupported",
      verificationReason: "An empty evidence quote cannot support a claim."
    };
  }
  for (const page of pages) {
    const normalizedPage = normalizeTextWithMap(page.text);
    const position = normalizedPage.normalized.indexOf(normalizedQuote);
    if (position >= 0) {
      const charStart = normalizedPage.indexMap[position] ?? 0;
      const lastMap = normalizedPage.indexMap[position + normalizedQuote.length - 1] ?? charStart;
      return {
        quote,
        normalizedQuote,
        page: page.pageNumber,
        charStart,
        charEnd: lastMap + 1,
        verificationStatus: "verified",
        verificationReason: "Exact match found after deterministic normalization."
      };
    }
  }
  for (const page of pages) {
    const normalizedPage = normalizeTextWithMap(page.text);
    const candidate = nearMatch(normalizedPage.normalized, normalizedQuote);
    if (candidate) {
      const charStart = normalizedPage.indexMap[candidate.start] ?? 0;
      const lastMap =
        normalizedPage.indexMap[candidate.start + candidate.text.length - 1] ?? charStart;
      return {
        quote,
        normalizedQuote,
        page: page.pageNumber,
        charStart,
        charEnd: lastMap + 1,
        verificationStatus: "near_match_review",
        verificationReason: "A strict near match was found; human review is required."
      };
    }
  }
  return {
    quote,
    normalizedQuote,
    page: null,
    charStart: null,
    charEnd: null,
    verificationStatus: "unsupported",
    verificationReason: "No supporting source found."
  };
}
