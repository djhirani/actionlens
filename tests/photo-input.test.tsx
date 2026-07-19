import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentCheck } from "@/components/document-check";
import { verifyImageEvidenceQuotes } from "@/lib/images/verify-quotes";

vi.mock("@/lib/images/input", () => ({
  isSupportedImage: (file: File) => file.type.startsWith("image/"),
  validateImageFile: () => undefined,
  hashFile: async () => "a".repeat(64),
  fileToDataUrl: async () => "data:image/png;base64,cGhvdG8="
}));

describe("photo evidence verification", () => {
  it("accepts whitespace-normalised quotes found in the transcription", () => {
    expect(
      verifyImageEvidenceQuotes("Please submit\n  the form by 24 July 2026.", [
        "submit the form by 24 July 2026"
      ])
    ).toBe(true);
  });

  it("rejects a card when any evidence quote is absent from the transcription", () => {
    expect(verifyImageEvidenceQuotes("Please submit the form.", ["Deadline: 24 July 2026"])).toBe(
      false
    );
  });
});

describe("photo confirmation UI", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  async function uploadWithResponse(response: unknown) {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:photo"),
      revokeObjectURL: vi.fn()
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => response }));
    render(<DocumentCheck photoInputEnabled />);
    fireEvent.change(screen.getByLabelText("Upload attachment — PDF or image"), {
      target: { files: [new File(["photo"], "letter.png", { type: "image/png" })] }
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyse document" }));
  }

  it("renders low confidence as the clearer-photo escalation and never a card", async () => {
    await uploadWithResponse({
      transcription: "Unreadable letter",
      readConfidence: "low",
      card: null,
      rejectionReason: null
    });
    expect(await screen.findByText("We couldn’t read this photo reliably.")).toBeInTheDocument();
    expect(screen.queryByText("Transcription is correct — save action")).not.toBeInTheDocument();
  });

  it("renders an unsupported quote rejection and never a card", async () => {
    await uploadWithResponse({
      transcription: "Please submit the form.",
      readConfidence: "high",
      card: null,
      rejectionReason: "No supporting source found."
    });
    expect(await screen.findByText("No supporting source found.")).toBeInTheDocument();
    expect(screen.queryByText("Transcription is correct — save action")).not.toBeInTheDocument();
  });

  it("keeps the existing PDF-only input and rejection when the feature flag is off", async () => {
    render(<DocumentCheck photoInputEnabled={false} />);
    const input = screen.getByLabelText("Text-based PDF") as HTMLInputElement;
    expect(input.accept).toBe("application/pdf,.pdf");
    fireEvent.change(input, {
      target: { files: [new File(["photo"], "letter.png", { type: "image/png" })] }
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyse document" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a PDF file.");
  });

  it("accepts a screenshot pasted from the clipboard into the photo path", () => {
    render(<DocumentCheck photoInputEnabled />);
    const screenshot = new File(["pixels"], "screenshot.png", { type: "image/png" });
    fireEvent.paste(screen.getByLabelText("Or paste a screenshot"), {
      clipboardData: {
        items: [{ kind: "file", type: "image/png", getAsFile: () => screenshot }]
      }
    });
    expect(screen.getByText("Selected: screenshot.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analyse document" })).toBeEnabled();
  });
});
