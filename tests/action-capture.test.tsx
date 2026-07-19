import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    fireEvent.click(screen.getByRole("button", { name: "Prepare action" }));
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
});
