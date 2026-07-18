import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PDF_WORKER_URL, PDF_WORKER_VERSION } from "@/lib/documents/extract-pdf";

function embeddedVersion(filePath: string) {
  const match = fs.readFileSync(filePath, "utf8").match(/pdfjsVersion = ([\d.]+)/);
  return match?.[1];
}

describe("PDF.js worker configuration", () => {
  const projectRoot = process.cwd();
  const legacyApi = path.join(projectRoot, "node_modules/pdfjs-dist/legacy/build/pdf.mjs");
  const legacyWorker = path.join(
    projectRoot,
    "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs"
  );
  const modernWorker = path.join(projectRoot, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
  const publicWorker = path.join(projectRoot, "public", PDF_WORKER_URL);

  it("uses a versioned legacy worker URL", () => {
    expect(PDF_WORKER_URL).toBe("/pdfjs/6.1.200/legacy/pdf.worker.min.mjs");
  });

  it("ships the exact legacy worker rather than the modern worker", () => {
    expect(fs.readFileSync(publicWorker).equals(fs.readFileSync(legacyWorker))).toBe(true);
    expect(fs.readFileSync(publicWorker).equals(fs.readFileSync(modernWorker))).toBe(false);
  });

  it("keeps the embedded legacy API and worker versions matched", () => {
    expect(embeddedVersion(legacyApi)).toBe(PDF_WORKER_VERSION);
    expect(embeddedVersion(publicWorker)).toBe(PDF_WORKER_VERSION);
  });
});
