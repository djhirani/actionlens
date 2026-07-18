import { NextResponse } from "next/server";
import { interpretAction } from "@/lib/ai/interpret-action";
import { InterpretRequestSchema } from "@/lib/schemas";
import { readBoundedJson, RequestBodyError } from "@/lib/http/bounded-json";

const MAX_REQUEST_BYTES = 12_000;

export async function POST(request: Request) {
  try {
    const body = await readBoundedJson(request, MAX_REQUEST_BYTES);
    const input = InterpretRequestSchema.parse(body);
    return NextResponse.json(await interpretAction(input));
  } catch (error) {
    const isValidation =
      error instanceof RequestBodyError || (error instanceof Error && error.name === "ZodError");
    return NextResponse.json(
      {
        error: isValidation
          ? "Check the instruction and time details."
          : "ActionLens could not prepare this draft. Try again."
      },
      { status: isValidation ? 400 : 502 }
    );
  }
}
