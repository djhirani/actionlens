import type { SourcePage } from "@/lib/schemas";

export const PDF_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  maxPages: 25,
  maxCharacters: 50_000
} as const;

export class PdfInputError extends Error {}

export const PDF_WORKER_URL = "/pdfjs/6.1.200/legacy/pdf.worker.min.mjs";
export const PDF_WORKER_VERSION = "6.1.200";

function serializeError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) return { value: String(error) };
  return {
    constructor: error.constructor.name,
    name: error.name,
    message: error.message,
    stack: error.stack ?? null,
    cause: error.cause ? serializeError(error.cause) : null
  };
}

export async function readPdfTextStream<T extends object>(
  stream: ReadableStream<{ items: T[] }>,
  onRead?: () => void
): Promise<T[]> {
  const reader = stream.getReader();
  const items: T[] = [];
  try {
    while (true) {
      onRead?.();
      const { value, done } = await reader.read();
      if (done) break;
      items.push(...value.items);
    }
  } catch (error) {
    try {
      await reader.cancel(error);
    } catch {
      // Reader cleanup must not replace the original stream error.
    }
    throw error;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Releasing an already-failed reader is cleanup only.
    }
  }
  return items;
}

export async function validatePdfFile(file: File) {
  if (file.type !== "application/pdf") throw new PdfInputError("Choose a PDF file.");
  if (file.size > PDF_LIMITS.maxBytes) throw new PdfInputError("The PDF must be 10 MB or smaller.");
  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(signature) !== "%PDF-")
    throw new PdfInputError("This file does not have a valid PDF signature.");
}

export function assertExtractedPdfLimits(pages: SourcePage[]) {
  if (pages.length > PDF_LIMITS.maxPages)
    throw new PdfInputError("Use a PDF with no more than 25 pages.");
  const characters = pages.reduce((total, page) => total + page.text.length, 0);
  if (characters > PDF_LIMITS.maxCharacters)
    throw new PdfInputError("This document is too long to analyse reliably");
  if (!pages.some((page) => page.text.trim()))
    throw new PdfInputError(
      "No selectable text was found. Image-only PDFs are not supported in this demo."
    );
}

export async function extractPdfText(file: File): Promise<SourcePage[]> {
  await validatePdfFile(file);
  const data = new Uint8Array(await file.arrayBuffer());
  let originalFailureStage = "pdfjs-import-start";
  let pdfjsVersion: string | undefined;
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjsVersion = pdfjs.version;
    originalFailureStage = "worker-configuration-start";
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
    originalFailureStage = "getDocument-created";
    const loadingTask = pdfjs.getDocument({ data });
    originalFailureStage = "loadingTask-promise-start";
    const document = await loadingTask.promise;
    let extractionError: unknown;
    try {
      if (document.numPages > PDF_LIMITS.maxPages)
        throw new PdfInputError("Use a PDF with no more than 25 pages.");
      const pages: SourcePage[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        originalFailureStage = "getPage-start";
        const page = await document.getPage(pageNumber);
        originalFailureStage = "streamTextContent-start";
        const stream = page.streamTextContent();
        originalFailureStage = "streamTextContent-read";
        const items = await readPdfTextStream(stream);
        const text = items.map((item) => ("str" in item ? item.str : "")).join(" ");
        pages.push({ pageNumber, text });
      }
      assertExtractedPdfLimits(pages);
      return pages;
    } catch (error) {
      extractionError = error;
      throw error;
    } finally {
      try {
        await loadingTask.destroy();
      } catch (destroyError) {
        if (extractionError === undefined) {
          originalFailureStage = "destroy-start";
          throw destroyError;
        }
        console.error(
          "PDF.js cleanup failed after an extraction error",
          serializeError(destroyError)
        );
      }
    }
  } catch (error) {
    if (error instanceof PdfInputError) throw error;
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") throw new PdfInputError("Encrypted PDFs are not supported.");
    if (name === "InvalidPDFException" || name === "MissingPDFException")
      throw new PdfInputError("ActionLens could not read this file because it is not a valid PDF.");
    console.error("PDF.js failed to parse the selected PDF", {
      failingStage: originalFailureStage,
      error: serializeError(error),
      pdfjsVersion,
      workerVersion: PDF_WORKER_VERSION,
      workerSrc: PDF_WORKER_URL,
      userAgent: typeof navigator === "undefined" ? undefined : navigator.userAgent
    });
    throw new PdfInputError(
      "The PDF parser could not start or finish. Keep the file selected and retry."
    );
  }
}

export async function extractCompletionPdfText(file: File): Promise<SourcePage[]> {
  const pages = await extractPdfText(file);
  if (pages.length > 3)
    throw new PdfInputError("Use completion evidence with no more than 3 pages.");
  if (pages.reduce((total, page) => total + page.text.length, 0) > 30_000)
    throw new PdfInputError("Completion evidence must contain no more than 30,000 characters.");
  return pages;
}
