import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/client";

const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
const AUDIO_TYPES = new Set([
  "audio/mp3",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm"
]);

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_AUDIO_BYTES)
      return NextResponse.json({ error: "Keep voice input under one minute." }, { status: 413 });
    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES)
      return NextResponse.json(
        { error: "The voice recording is empty or too large." },
        { status: 400 }
      );
    const mimeType = audio.type.split(";")[0] ?? "";
    if (!AUDIO_TYPES.has(mimeType))
      return NextResponse.json(
        { error: "This voice recording format is not supported." },
        { status: 400 }
      );
    const locale = String(form.get("locale") ?? "")
      .slice(0, 2)
      .toLowerCase();
    const transcription = await getOpenAIClient().audio.transcriptions.create({
      file: audio,
      model: "gpt-4o-transcribe",
      ...(locale.match(/^[a-z]{2}$/) ? { language: locale } : {}),
      prompt:
        "This is a short dictated task or reminder. Transcribe every instruction accurately using standard spelling, punctuation, dates, and times. Preserve names and do not add information."
    });
    const text = transcription.text.trim().slice(0, 2000);
    if (!text)
      return NextResponse.json(
        { error: "No speech was detected. Please try again." },
        { status: 422 }
      );
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "Voice transcription failed. Please try again or type the action." },
      { status: 502 }
    );
  }
}
