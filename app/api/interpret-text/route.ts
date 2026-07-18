import { NextResponse } from "next/server";
import { interpretAction } from "@/lib/ai/interpret-action";
import { InterpretRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const input = InterpretRequestSchema.parse(body);
    return NextResponse.json(await interpretAction(input));
  } catch (error) {
    const isValidation = error instanceof Error && error.name === "ZodError";
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
