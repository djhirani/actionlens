import { describe, expect, it } from "vitest";
import { matchEvidence } from "@/lib/documents/evidence-match";
import { normalizeText } from "@/lib/documents/normalize";

const page = (text: string) => [{ pageNumber: 1, text }];

describe("deterministic evidence matching", () => {
  it("verifies an exact evidence quote", () => {
    expect(
      matchEvidence(
        page("Please upload sponsorship confirmation."),
        "Please upload sponsorship confirmation."
      ).verificationStatus
    ).toBe("verified");
  });
  it("verifies after whitespace normalization", () => {
    expect(
      matchEvidence(
        page("Please upload\n  sponsorship confirmation."),
        "Please upload sponsorship confirmation."
      ).verificationStatus
    ).toBe("verified");
  });
  it("verifies after smart-quote normalization", () => {
    expect(
      matchEvidence(
        page("Upload the “sponsorship confirmation”."),
        'Upload the "sponsorship confirmation".'
      ).verificationStatus
    ).toBe("verified");
  });
  it("repairs a safe PDF line-break hyphen", () => {
    expect(normalizeText("sponsor-\n ship confirmation")).toBe("sponsorship confirmation");
  });
  it("returns unsupported when no quote exists", () => {
    expect(
      matchEvidence(page("The office is closed."), "Upload sponsorship confirmation.")
        .verificationStatus
    ).toBe("unsupported");
  });
  it("labels a strict near match for review and never verifies it", () => {
    expect(
      matchEvidence(
        page("Please upload your sponsorship confirmation document today."),
        "Please upload the sponsorship confirmation document today."
      ).verificationStatus
    ).toBe("near_match_review");
  });
});
