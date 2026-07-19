import { NextResponse } from "next/server";
import { analyzeImage } from "@/lib/ai/analyze-image";
import { readBoundedJson, RequestBodyError } from "@/lib/http/bounded-json";
import { AnalyzeImageRequestSchema } from "@/lib/schemas";

const MAX_REQUEST_BYTES = 14_100_000;

export async function POST(request: Request) {
  if (process.env.PHOTO_INPUT_ENABLED?.toLowerCase() === "false")
    return NextResponse.json({ error: "Photo input is not enabled." }, { status: 404 });
  try {
    const body = await readBoundedJson(request, MAX_REQUEST_BYTES);
    const input = AnalyzeImageRequestSchema.parse(body);
    if (!input.imageDataUrl.startsWith(`data:${input.mimeType};base64,`))
      return NextResponse.json({ error: "The photo data is invalid." }, { status: 400 });
    return NextResponse.json(await analyzeImage(input));
  } catch (error) {
    const validation =
      error instanceof RequestBodyError || (error instanceof Error && error.name === "ZodError");
    return NextResponse.json(
      {
        error: validation
          ? "The photo did not meet ActionLens limits."
          : "ActionLens could not analyse this photo. Try again."
      },
      { status: validation ? 400 : 502 }
    );
  }
}
