import { NextResponse } from "next/server";
import { verifyCompletion } from "@/lib/ai/verify-completion";
import { VerifyCompletionRequestSchema } from "@/lib/schemas";
import { readBoundedJson, RequestBodyError } from "@/lib/http/bounded-json";

const MAX_REQUEST_BYTES = 180_000;

export async function POST(request: Request) {
  try {
    const body = await readBoundedJson(request, MAX_REQUEST_BYTES);
    return NextResponse.json(await verifyCompletion(VerifyCompletionRequestSchema.parse(body)));
  } catch (error) {
    const validation =
      error instanceof RequestBodyError || (error instanceof Error && error.name === "ZodError");
    return NextResponse.json(
      {
        error: validation
          ? "The completion evidence did not meet ActionLens limits."
          : "ActionLens could not check this completion evidence. Try again."
      },
      { status: validation ? 400 : 502 }
    );
  }
}
