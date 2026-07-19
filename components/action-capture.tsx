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
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const speechBaseRef = useRef("");

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function toggleSpeech() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setSpeechSupported(false);
      setError("Voice input is not supported by this browser. You can still type the action.");
      return;
    }
    setSpeechSupported(true);
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-GB";
    speechBaseRef.current = instruction.trim();
    recognition.onresult = (event) => {
      const spoken = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      const separator = speechBaseRef.current && spoken ? " " : "";
      setInstruction(`${speechBaseRef.current}${separator}${spoken}`.slice(0, 2000));
      setState("idle");
    };
    recognition.onerror = (event) => {
      setError(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone access was blocked. Allow microphone access and try again."
          : "Voice input could not hear that. Try again or type the action."
      );
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setError(null);
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      recognitionRef.current = null;
      setError("Voice input could not start. Try again or type the action.");
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
          aria-pressed={listening}
          disabled={state === "loading" || speechSupported === false}
          onClick={toggleSpeech}
        >
          {listening ? "Stop listening" : "🎙 Speak"}
        </button>
        {speechSupported === false ? (
          <p className="hint">Voice input is unavailable in this browser.</p>
        ) : listening ? (
          <p className="hint" role="status">Listening… speak the action now.</p>
        ) : null}
        <button
          className="button primary"
          type="button"
          disabled={!instruction.trim() || state === "loading"}
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
