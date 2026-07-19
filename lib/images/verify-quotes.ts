import { normalizeText } from "@/lib/documents/normalize";

export function verifyImageEvidenceQuotes(transcription: string, quotes: string[]) {
  const source = normalizeText(transcription);
  return (
    quotes.length > 0 &&
    quotes.every((quote) => {
      const normalizedQuote = normalizeText(quote);
      return normalizedQuote.length > 0 && source.includes(normalizedQuote);
    })
  );
}
