import { NextResponse } from "next/server";
import { checkScam } from "@/lib/ai/check-scam";
import { readBoundedJson, RequestBodyError } from "@/lib/http/bounded-json";
import { ScamAssessmentSchema, ScamCheckRequestSchema } from "@/lib/schemas";

const MAX_REQUEST_BYTES = 55_000;

export async function POST(request: Request) {
  if (process.env.SCAM_CHECK_ENABLED?.toLowerCase() === "false")
    return NextResponse.json(ScamAssessmentSchema.parse({ scamRisk: "none", signals: [] }));
  try {
    const body = await readBoundedJson(request, MAX_REQUEST_BYTES);
    const input = ScamCheckRequestSchema.parse(body);
    return NextResponse.json(await checkScam(input.text));
  } catch (error) {
    const validation =
      error instanceof RequestBodyError || (error instanceof Error && error.name === "ZodError");
    return NextResponse.json(
      {
        error: validation
          ? "The content did not meet scam-check limits."
          : "Scam risk could not be assessed. Try again."
      },
      { status: validation ? 400 : 502 }
    );
  }
}
