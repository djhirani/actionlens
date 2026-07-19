import { describe, expect, it } from "vitest";
import { assertExtractedPdfLimits, validatePdfFile } from "@/lib/documents/extract-pdf";
import { matchEvidence } from "@/lib/documents/evidence-match";

function pdfFile(content = "%PDF-1.7", type = "application/pdf") {
  return new File([content], "notice.pdf", { type });
}

describe("PDF input limits", () => {
  it("rejects a non-PDF MIME type", async () => {
    await expect(validatePdfFile(pdfFile("%PDF-1.7", "text/plain"))).rejects.toThrow(
      "Choose a PDF file"
    );
  });
  it("rejects an invalid PDF magic byte signature", async () => {
    await expect(validatePdfFile(pdfFile("not a pdf"))).rejects.toThrow("valid PDF signature");
  });
  it("rejects more than 25 pages", () => {
    expect(() =>
      assertExtractedPdfLimits(
        Array.from({ length: 26 }, (_, index) => ({ pageNumber: index + 1, text: "text" }))
      )
    ).toThrow("Use a PDF with no more than 25 pages.");
  });
  it("accepts all 19 pages and makes the final-page text available to verification", () => {
    const pages = Array.from({ length: 19 }, (_, index) => ({
      pageNumber: index + 1,
      text:
        index === 18
          ? "Review conclusion: pay the assessed amount by 30 September 2026."
          : `Official notice page ${index + 1}.`
    }));
    expect(() => assertExtractedPdfLimits(pages)).not.toThrow();
    expect(matchEvidence(pages, "pay the assessed amount by 30 September 2026")).toMatchObject({
      page: 19,
      verificationStatus: "verified"
    });
  });
  it("rejects more than 50,000 extracted characters", () => {
    expect(() => assertExtractedPdfLimits([{ pageNumber: 1, text: "a".repeat(50_001) }])).toThrow(
      "This document is too long to analyse reliably"
    );
  });
  it("returns an image-only PDF error when no selectable text exists", () => {
    expect(() => assertExtractedPdfLimits([{ pageNumber: 1, text: "  " }])).toThrow(
      "Image-only PDFs"
    );
  });
});
