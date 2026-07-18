import { NextResponse } from "next/server";
import { verifyCompletion } from "@/lib/ai/verify-completion";
import { VerifyCompletionRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    return NextResponse.json(await verifyCompletion(VerifyCompletionRequestSchema.parse(body)));
  } catch (error) {
    const validation = error instanceof Error && error.name === "ZodError";
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
