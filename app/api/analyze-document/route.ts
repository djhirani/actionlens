import { NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/ai/analyze-document";
import { AnalyzeDocumentRequestSchema } from "@/lib/schemas";
import { readBoundedJson, RequestBodyError } from "@/lib/http/bounded-json";

const MAX_REQUEST_BYTES = 220_000;

export async function POST(request: Request) {
  try {
    const body = await readBoundedJson(request, MAX_REQUEST_BYTES);
    const input = AnalyzeDocumentRequestSchema.parse(body);
    return NextResponse.json(await analyzeDocument(input));
  } catch (error) {
    const validation =
      error instanceof RequestBodyError || (error instanceof Error && error.name === "ZodError");
    return NextResponse.json(
      {
        error: validation
          ? "The extracted document did not meet ActionLens limits."
          : "ActionLens could not analyse this document. Try again."
      },
      { status: validation ? 400 : 502 }
    );
  }
}
