import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentCheck } from "@/components/document-check";
import { actionRepository, getDatabase, resetDatabaseForTests } from "@/lib/db";
import { verifyImageEvidenceQuotes } from "@/lib/images/verify-quotes";

vi.mock("@/lib/images/input", () => ({
  isSupportedImage: (file: File) => file.type.startsWith("image/"),
  validateImageFile: () => undefined,
  hashFile: async () => "a".repeat(64),
  fileToDataUrl: async () => "data:image/png;base64,cGhvdG8="
}));

vi.mock("@/components/evidence-bridge", () => ({
  EvidenceBridge: () => <div data-testid="evidence-bridge" />
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
  afterEach(async () => {
    cleanup();
    await getDatabase().delete();
    resetDatabaseForTests();
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
    fireEvent.change(screen.getByLabelText("Letter, email, text message, or document"), {
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
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:pasted-screenshot"),
      revokeObjectURL: vi.fn()
    });
    render(<DocumentCheck photoInputEnabled />);
    const screenshot = new File(["pixels"], "screenshot.png", { type: "image/png" });
    fireEvent.paste(screen.getByRole("button", { name: "Upload attachment or paste screenshot" }), {
      clipboardData: {
        items: [{ kind: "file", type: "image/png", getAsFile: () => screenshot }]
      }
    });
    expect(screen.getByAltText("Selected attachment preview")).toHaveAttribute(
      "src",
      "blob:pasted-screenshot"
    );
    expect(screen.getByText("Selected: screenshot.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analyse document" })).toBeEnabled();
  });

  it("accepts a fresh upload after a proof-linked action is confirmed", async () => {
    render(<DocumentCheck />);
    fireEvent.click(screen.getByRole("button", { name: "Try a source-verified action" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Proof-Linked Action" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Proof-Linked Action confirmed and saved locally."
    );
    await waitFor(async () => expect(await actionRepository.count()).toBe(1));
    expect((await actionRepository.listConfirmed())[0]?.status).toBe("confirmed");

    const input = screen.getByLabelText("Text-based PDF");
    expect(input).toBeEnabled();
    fireEvent.change(input, {
      target: { files: [new File(["fresh"], "fresh-upload.pdf", { type: "application/pdf" })] }
    });

    expect(screen.getByText("Selected: fresh-upload.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analyse document" })).toBeEnabled();
    expect(screen.queryByText("Proof-Linked Action confirmed and saved locally.")).toBeNull();
  });
});
