import { describe, expect, it, vi } from "vitest";
import { readPdfTextStream } from "@/lib/documents/extract-pdf";

type TextItem = { str: string };

describe("PDF text streaming", () => {
  it("uses getReader reads when ReadableStream async iteration is broken", async () => {
    const stream = new ReadableStream<{ items: TextItem[] }>({
      start(controller) {
        controller.enqueue({ items: [{ str: "Safari-safe" }] });
        controller.close();
      }
    });
    Object.defineProperty(stream, Symbol.asyncIterator, {
      value: () => {
        throw new TypeError("async iteration is unavailable");
      }
    });

    await expect(readPdfTextStream(stream)).resolves.toEqual([{ str: "Safari-safe" }]);
  });

  it("combines multiple text chunks in order", async () => {
    const stream = new ReadableStream<{ items: TextItem[] }>({
      start(controller) {
        controller.enqueue({ items: [{ str: "first" }, { str: "second" }] });
        controller.enqueue({ items: [{ str: "third" }] });
        controller.close();
      }
    });

    await expect(readPdfTextStream(stream)).resolves.toEqual([
      { str: "first" },
      { str: "second" },
      { str: "third" }
    ]);
  });

  it("preserves a reader error when cancel and releaseLock also fail", async () => {
    const originalError = new TypeError("stream read failed");
    const cancel = vi.fn().mockRejectedValue(new Error("cancel failed"));
    const releaseLock = vi.fn(() => {
      throw new Error("release failed");
    });
    const stream = {
      getReader: () => ({
        read: vi.fn().mockRejectedValue(originalError),
        cancel,
        releaseLock
      })
    } as unknown as ReadableStream<{ items: TextItem[] }>;

    await expect(readPdfTextStream(stream)).rejects.toBe(originalError);
    expect(cancel).toHaveBeenCalledWith(originalError);
    expect(releaseLock).toHaveBeenCalledOnce();
  });
});
