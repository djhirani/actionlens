import { describe, expect, it } from "vitest";
import { hashSourcePages } from "@/lib/documents/hash";

describe("source hashing", () => {
  it("is stable across equivalent source whitespace", async () => {
    const first = await hashSourcePages([
      { pageNumber: 1, text: "Upload   sponsorship\nconfirmation" }
    ]);
    const second = await hashSourcePages([
      { pageNumber: 1, text: "Upload sponsorship confirmation" }
    ]);
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });
});
