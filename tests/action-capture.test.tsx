import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActionCapture } from "@/components/action-capture";
import { actionRepository, getDatabase, resetDatabaseForTests } from "@/lib/db";
import { actionFixture } from "./helpers";

describe("human confirmation flow", () => {
  beforeEach(async () => {
    resetDatabaseForTests();
    await getDatabase().delete();
    resetDatabaseForTests();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => actionFixture() })
    );
  });
  afterEach(async () => {
    cleanup();
    await getDatabase().delete();
    resetDatabaseForTests();
    vi.unstubAllGlobals();
  });
  async function prepare() {
    render(<ActionCapture />);
    fireEvent.change(screen.getByLabelText("Instruction"), {
      target: { value: "Call the university tomorrow at 10" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create action" }));
    await screen.findByText("Review this action");
  }
  it("saves only after confirmation", async () => {
    await prepare();
    expect(screen.getByText(/Sunday, 19 July 2026 at 10:00/)).toBeInTheDocument();
    expect(await actionRepository.count()).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Confirm and save" }));
    await waitFor(async () => expect(await actionRepository.count()).toBe(1));
    expect(screen.getByRole("status")).toHaveTextContent("saved locally");
  });
  it("records explicit confirmation as completion of human review", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () =>
        actionFixture({
          uncertainty: {
            requiresHumanReview: true,
            reasons: ["The supplied time was ambiguous."],
            clarificationQuestion: "Which time did you mean?"
          }
        })
    } as Response);
    await prepare();
    fireEvent.click(screen.getByRole("button", { name: "Confirm and save" }));

    await waitFor(async () => expect(await actionRepository.count()).toBe(1));
    const [saved] = await actionRepository.listConfirmed();
    expect(saved?.uncertainty.requiresHumanReview).toBe(false);
    expect(saved?.uncertainty.reasons).toEqual(["The supplied time was ambiguous."]);
  });
  it("discard does not save", async () => {
    await prepare();
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.getByText("Nothing is saved yet.")).toBeInTheDocument();
    expect(await actionRepository.count()).toBe(0);
  });
  it("transcribes microphone speech into the instruction field", async () => {
    let emitResult:
      ((event: { results: ArrayLike<{ 0?: { transcript: string } }> }) => void) | null = null;
    let emitEnd: (() => void) | null = null;
    class MockSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = "";
      get onresult() {
        return emitResult;
      }
      set onresult(value) {
        emitResult = value;
      }
      onerror: ((event: { error: string }) => void) | null = null;
      get onend() {
        return emitEnd;
      }
      set onend(value) {
        emitEnd = value;
      }
      start() {}
      stop() {
        emitEnd?.();
      }
    }
    class MockMediaRecorder {
      static isTypeSupported() {
        return true;
      }
      state: RecordingState = "inactive";
      mimeType = "audio/webm";
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onerror: (() => void) | null = null;
      onstop: (() => void) | null = null;
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob(["voice"], { type: "audio/webm" }) } as BlobEvent);
        this.onstop?.();
      }
    }
    vi.stubGlobal("MediaRecorder", MockMediaRecorder);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }]
        })
      }
    });
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: MockSpeechRecognition
    });
    vi.mocked(fetch).mockImplementation(async (input) =>
      String(input) === "/api/transcribe-audio"
        ? ({ ok: true, json: async () => ({ text: "Call the university tomorrow." }) } as Response)
        : ({ ok: true, json: async () => actionFixture() } as Response)
    );
    render(<ActionCapture />);
    fireEvent.click(screen.getByRole("button", { name: "🎙 Speak" }));
    await screen.findByRole("button", { name: "Stop and transcribe" });
    act(() => {
      emitResult?.({
        results: [{ 0: { transcript: "call the univercity tomorow" } }]
      });
      emitEnd?.();
    });

    expect(screen.getByLabelText("Instruction")).toHaveValue("call the univercity tomorow");
    fireEvent.click(screen.getByRole("button", { name: "Stop and transcribe" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Instruction")).toHaveValue("Call the university tomorrow.")
    );
    expect(screen.getByRole("button", { name: "Create action" })).toBeEnabled();
    delete (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition;
    Reflect.deleteProperty(navigator, "mediaDevices");
  });
});
