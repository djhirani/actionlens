import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentCheck } from "@/components/document-check";
import { getVerifiedFixtureResult } from "@/lib/demo/verified-fixture";

vi.mock("@/lib/documents/extract-pdf", () => ({
  extractPdfText: async () => [{ pageNumber: 1, text: "Please upload the named document." }]
}));

vi.mock("@/lib/documents/hash", () => ({
  hashSourcePages: async () => "a".repeat(64)
}));

vi.mock("@/components/evidence-bridge", () => ({
  EvidenceBridge: () => <div data-testid="evidence-bridge" />
}));

describe("document analysis latency", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("starts the independent scam check before document analysis completes", async () => {
    let finishAnalysis: ((response: Response) => void) | undefined;
    const analysisResponse = new Promise<Response>((resolve) => {
      finishAnalysis = resolve;
    });
    const fetchMock = vi.fn((url: string | URL | Request) => {
      if (String(url) === "/api/analyze-document") return analysisResponse;
      return Promise.resolve({
        ok: true,
        json: async () => ({ scamRisk: "none", signals: [] })
      } as Response);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<DocumentCheck scamCheckEnabled />);
    fireEvent.change(screen.getByLabelText("Text-based PDF"), {
      target: { files: [new File(["pdf"], "letter.pdf", { type: "application/pdf" })] }
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyse document" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "/api/analyze-document",
      "/api/check-scam"
    ]);

    finishAnalysis?.({
      ok: true,
      json: async () => getVerifiedFixtureResult()
    } as Response);
    await screen.findByRole("button", { name: "Confirm Proof-Linked Action" });
  });
});
