import { describe, expect, it } from "vitest";
import { assertExtractedPdfLimits, validatePdfFile } from "@/lib/documents/extract-pdf";

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
  it("rejects more than five pages", () => {
    expect(() =>
      assertExtractedPdfLimits(
        Array.from({ length: 6 }, (_, index) => ({ pageNumber: index + 1, text: "text" }))
      )
    ).toThrow("no more than 5 pages");
  });
  it("rejects more than 50,000 extracted characters", () => {
    expect(() => assertExtractedPdfLimits([{ pageNumber: 1, text: "a".repeat(50_001) }])).toThrow(
      "50,000"
    );
  });
  it("returns an image-only PDF error when no selectable text exists", () => {
    expect(() => assertExtractedPdfLimits([{ pageNumber: 1, text: "  " }])).toThrow(
      "Image-only PDFs"
    );
  });
});
