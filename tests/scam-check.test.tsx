import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionCapture } from "@/components/action-capture";
import { verifyScamAssessment } from "@/lib/scam/verify-signals";
import { actionFixture } from "./helpers";

describe("scam signal verification", () => {
  it("drops quoted signals that are absent from the source", () => {
    expect(
      verifyScamAssessment("Pay using gift cards today.", {
        scamRisk: "likely",
        signals: [
          { text: "Pay using gift cards today.", isQuote: true },
          { text: "Your account will be closed", isQuote: true },
          { text: "Unusual payment method", isQuote: false }
        ]
      })
    ).toEqual({
      scamRisk: "likely",
      signals: ["Pay using gift cards today.", "Unusual payment method"]
    });
  });

  it.each([
    "University letter: Please submit your sponsorship confirmation by 24 July 2026.",
    "Hospital letter: Submit the online eligibility form by 22 July 2026."
  ])("keeps clean fixture-style letters at no risk", (text) => {
    expect(verifyScamAssessment(text, { scamRisk: "none", signals: [] })).toEqual({
      scamRisk: "none",
      signals: []
    });
  });
});

describe("scam guard UI", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows a likely-scam warning and no action card", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === "/api/check-scam")
          return {
            ok: true,
            json: async () => ({
              scamRisk: "likely",
              signals: ["Pay using gift cards today"]
            })
          };
        return { ok: true, json: async () => actionFixture() };
      })
    );
    render(<ActionCapture scamCheckEnabled />);
    fireEvent.change(screen.getByLabelText("Instruction"), {
      target: { value: "Pay using gift cards today" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create action" }));
    expect(
      await screen.findByRole("heading", {
        name: "Suspected scam — do not pay, do not click, do not reply"
      })
    ).toBeInTheDocument();
    expect(screen.queryByText("Review this action")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm and save" })).not.toBeInTheDocument();
  });

  it("keeps the normal card flow for content assessed as clean", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        String(input) === "/api/check-scam"
          ? { ok: true, json: async () => ({ scamRisk: "none", signals: [] }) }
          : { ok: true, json: async () => actionFixture() }
      )
    );
    render(<ActionCapture scamCheckEnabled />);
    fireEvent.change(screen.getByLabelText("Instruction"), {
      target: { value: "Call the university tomorrow at 10" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create action" }));
    expect(await screen.findByText("Review this action")).toBeInTheDocument();
    expect(screen.queryByText(/Suspected scam/)).not.toBeInTheDocument();
  });
});
