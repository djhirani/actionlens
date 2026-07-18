export class RequestBodyError extends Error {}

export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes)
    throw new RequestBodyError("Request body exceeds the allowed size.");

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes)
    throw new RequestBodyError("Request body exceeds the allowed size.");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new RequestBodyError("Request body must be valid JSON.");
  }
}
