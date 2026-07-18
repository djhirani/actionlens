import type { SourcePage } from "@/lib/schemas";

export const PDF_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  maxPages: 5,
  maxCharacters: 50_000
} as const;

export class PdfInputError extends Error {}

export async function validatePdfFile(file: File) {
  if (file.type !== "application/pdf") throw new PdfInputError("Choose a PDF file.");
  if (file.size > PDF_LIMITS.maxBytes) throw new PdfInputError("The PDF must be 10 MB or smaller.");
  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(signature) !== "%PDF-")
    throw new PdfInputError("This file does not have a valid PDF signature.");
}

export function assertExtractedPdfLimits(pages: SourcePage[]) {
  if (pages.length > PDF_LIMITS.maxPages)
    throw new PdfInputError("Use a PDF with no more than 5 pages.");
  const characters = pages.reduce((total, page) => total + page.text.length, 0);
  if (characters > PDF_LIMITS.maxCharacters)
    throw new PdfInputError("The extracted text exceeds 50,000 characters.");
  if (!pages.some((page) => page.text.trim()))
    throw new PdfInputError(
      "No selectable text was found. Image-only PDFs are not supported in this demo."
    );
}

export async function extractPdfText(file: File): Promise<SourcePage[]> {
  await validatePdfFile(file);
  const data = new Uint8Array(await file.arrayBuffer());
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    const loadingTask = pdfjs.getDocument({ data });
    const document = await loadingTask.promise;
    try {
      if (document.numPages > PDF_LIMITS.maxPages)
        throw new PdfInputError("Use a PDF with no more than 5 pages.");
      const pages: SourcePage[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
        pages.push({ pageNumber, text });
      }
      assertExtractedPdfLimits(pages);
      return pages;
    } finally {
      await loadingTask.destroy();
    }
  } catch (error) {
    if (error instanceof PdfInputError) throw error;
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") throw new PdfInputError("Encrypted PDFs are not supported.");
    throw new PdfInputError(
      "ActionLens could not read this PDF. Try a text-based, unencrypted PDF."
    );
  }
}
