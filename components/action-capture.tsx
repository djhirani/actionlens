"use client";
import { useEffect, useRef, useState } from "react";
import { ActionCard } from "@/components/action-card";
import { ScamNotice } from "@/components/scam-notice";
import { actionRepository } from "@/lib/db";
import { requestScamCheck, NO_SCAM_RISK } from "@/lib/scam/client";
import { ActionItemSchema, type ActionItem, type ScamAssessment } from "@/lib/schemas";
import { getTimeContext } from "@/lib/time-context";

type SpeechResultEvent = {
  results: ArrayLike<{ 0?: { transcript: string } }>;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function ActionCapture({ scamCheckEnabled = false }: { scamCheckEnabled?: boolean }) {
  const [instruction, setInstruction] = useState("");
  const [draft, setDraft] = useState<ActionItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [scamAssessment, setScamAssessment] = useState<ScamAssessment>(NO_SCAM_RISK);
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "transcribing">("idle");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const microphoneRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechBaseRef = useRef("");

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      microphoneRef.current?.getTracks().forEach((track) => track.stop());
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    };
  }, []);

  function releaseMicrophone() {
    microphoneRef.current?.getTracks().forEach((track) => track.stop());
    microphoneRef.current = null;
    recorderRef.current = null;
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    recordingTimerRef.current = null;
  }

  function stopSpeech() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function startSpeech() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording is not supported by this browser. You can still type the action.");
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      microphoneRef.current = stream;
      audioChunksRef.current = [];
      speechBaseRef.current = instruction.trim();
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) =>
        MediaRecorder.isTypeSupported(type)
      );
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setError("Voice recording failed. Please try again or type the action.");
        setVoiceState("idle");
        releaseMicrophone();
      };
      recorder.onstop = async () => {
        const audio = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        releaseMicrophone();
        if (!audio.size) {
          setError("No speech was recorded. Please try again.");
          setVoiceState("idle");
          return;
        }
        setVoiceState("transcribing");
        try {
          const form = new FormData();
          form.append("audio", audio, audio.type.includes("mp4") ? "voice.mp4" : "voice.webm");
          form.append("locale", navigator.language || "en-GB");
          const response = await fetch("/api/transcribe-audio", { method: "POST", body: form });
          const data: unknown = await response.json();
          if (!response.ok)
            throw new Error(
              typeof data === "object" && data && "error" in data
                ? String(data.error)
                : "Voice transcription failed."
            );
          const transcript =
            typeof data === "object" && data && "text" in data ? String(data.text).trim() : "";
          if (!transcript) throw new Error("No speech was detected. Please try again.");
          const separator = speechBaseRef.current && transcript ? " " : "";
          setInstruction(`${speechBaseRef.current}${separator}${transcript}`.slice(0, 2000));
          setState("idle");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Voice transcription failed.");
        } finally {
          setVoiceState("idle");
        }
      };
      recorder.start(250);
      setVoiceState("recording");
      recordingTimerRef.current = setTimeout(stopSpeech, 60_000);

      const speechWindow = window as SpeechWindow;
      const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
      if (Recognition) {
        const recognition = new Recognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = navigator.language || "en-GB";
        recognition.onresult = (event) => {
          const spoken = Array.from(event.results)
            .map((result) => result[0]?.transcript ?? "")
            .join(" ")
            .trim();
          const separator = speechBaseRef.current && spoken ? " " : "";
          setInstruction(`${speechBaseRef.current}${separator}${spoken}`.slice(0, 2000));
          setState("idle");
        };
        recognition.onerror = () => undefined;
        recognition.onend = () => {
          recognitionRef.current = null;
        };
        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch {
          recognitionRef.current = null;
        }
      }
    } catch (caught) {
      releaseMicrophone();
      setVoiceState("idle");
      setError(
        caught instanceof DOMException && caught.name === "NotAllowedError"
          ? "Microphone access was blocked. Allow microphone access and try again."
          : "Voice recording could not start. Please try again or type the action."
      );
    }
  }
  async function prepare() {
    setState("loading");
    setError(null);
    setDraft(null);
    setScamAssessment(NO_SCAM_RISK);
    try {
      const response = await fetch("/api/interpret-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction, timeContext: getTimeContext() })
      });
      const data: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          typeof data === "object" && data && "error" in data
            ? String(data.error)
            : "Could not prepare the draft."
        );
      const nextAssessment = await requestScamCheck(instruction, scamCheckEnabled);
      setScamAssessment(nextAssessment);
      if (nextAssessment.scamRisk !== "likely") setDraft(ActionItemSchema.parse(data));
    } catch (caught) {
      setError(
        caught instanceof TypeError
          ? "The draft could not reach ActionLens. Check your connection and try again."
          : caught instanceof Error
            ? caught.message
            : "Could not prepare the draft."
      );
    } finally {
      setState("idle");
    }
  }
  async function confirm() {
    if (!draft) return;
    try {
      await actionRepository.saveConfirmed({
        ...draft,
        uncertainty: { ...draft.uncertainty, requiresHumanReview: false }
      });
      setDraft(null);
      setInstruction("");
      setEditing(false);
      setState("saved");
    } catch {
      setError("This action could not be saved locally.");
    }
  }
  function discard() {
    setDraft(null);
    setEditing(false);
    setState("idle");
    setError(null);
    setScamAssessment(NO_SCAM_RISK);
  }
  return (
    <div className="workspace">
      <section className="card" aria-labelledby="capture-heading">
        <h2 id="capture-heading">What needs doing?</h2>
        <label htmlFor="instruction">Instruction</label>
        <textarea
          id="instruction"
          value={instruction}
          maxLength={2000}
          disabled={state === "loading"}
          placeholder="Remind me tomorrow at 10 to call the university about my sponsorship letter."
          onChange={(event) => {
            setInstruction(event.target.value);
            setState("idle");
            setScamAssessment(NO_SCAM_RISK);
          }}
        />
        <p className="hint">
          {instruction.length}/2,000 characters · your timezone and locale are included for date
          interpretation.
        </p>
        <button
          className="button secondary"
          type="button"
          aria-pressed={voiceState === "recording"}
          disabled={state === "loading" || voiceState === "transcribing"}
          onClick={voiceState === "recording" ? stopSpeech : startSpeech}
        >
          {voiceState === "recording"
            ? "Stop and transcribe"
            : voiceState === "transcribing"
              ? "Transcribing…"
              : "🎙 Speak"}
        </button>
        {voiceState === "recording" ? (
          <p className="hint" role="status">
            Listening… your words will appear as you speak.
          </p>
        ) : voiceState === "transcribing" ? (
          <p className="hint" role="status">
            Improving spelling and finalizing your words…
          </p>
        ) : null}
        <p className="hint">
          Voice uses live browser transcription, then sends the recording to OpenAI for the final
          transcript. The recording is not saved by ActionLens.
        </p>
        <button
          className="button primary"
          type="button"
          disabled={!instruction.trim() || state === "loading" || voiceState !== "idle"}
          onClick={prepare}
        >
          {state === "loading" ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Preparing draft…
            </>
          ) : (
            "Prepare action"
          )}
        </button>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        {state === "saved" ? (
          <p className="success" role="status">
            Action confirmed and saved locally.
          </p>
        ) : null}
      </section>
      {scamAssessment.scamRisk === "likely" ? <ScamNotice assessment={scamAssessment} /> : null}
      <section className="card" aria-live="polite">
        {draft ? (
          <>
            <ScamNotice assessment={scamAssessment} />
            <ActionCard action={draft} editing={editing} onChange={setDraft} />
            <div className="actions">
              <button className="button primary" type="button" onClick={confirm}>
                Confirm and save
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => setEditing((value) => !value)}
              >
                {editing ? "Finish editing" : "Edit"}
              </button>
              <button className="button ghost" type="button" onClick={discard}>
                Discard
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">Preview</p>
            <h2>Nothing is saved yet.</h2>
            <p className="muted">
              Your editable Action Card will appear here. Confirm it only when the action and timing
              look right.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
