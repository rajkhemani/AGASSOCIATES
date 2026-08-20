"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal typings for the Web Speech API.
 *
 * SpeechRecognition is not in lib.dom because it has never left the WICG
 * incubation stage, so the shape it is actually implemented with — prefixed on
 * Chromium, unprefixed on Safari 16+ — is declared here rather than pulled from
 * a dependency. Only the members this hook touches are described.
 */
interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
}
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** What went wrong, in words a person can act on. */
function describe(error: string): string {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was blocked. Allow it in your browser, or type instead.";
    case "no-speech":
      return "Nothing was heard. Try again, or type instead.";
    case "audio-capture":
      return "No microphone was found. Type instead.";
    case "network":
      return "Dictation needs a network connection. Type instead.";
    default:
      return "Dictation stopped unexpectedly. Type instead.";
  }
}

export interface Dictation {
  /** False on Firefox and anywhere else the API is absent — render nothing. */
  supported: boolean;
  listening: boolean;
  /** Live text while speaking; cleared once the result is committed. */
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
}

/**
 * Single-utterance dictation for one form field.
 *
 * Runs entirely in the browser. The site is a static export with no backend, so
 * anything that needed a server to transcribe could not ship here at all — and
 * the browser's own recogniser covers the Indic languages this practice
 * actually receives enquiries in without a model to host or a bill to pay.
 *
 * `continuous` is off deliberately: these are short fields — an institution
 * name, an email — not dictation of prose. One press, one utterance, one
 * commit. The caller receives the final text through `onCommit` rather than
 * reading state, so a field's value stays owned by the field.
 */
export function useDictation(
  lang: string,
  onCommit: (text: string) => void,
): Dictation {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Held in a ref so changing language or handler mid-session never tears down
  // a recogniser that is currently listening.
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    // Pressing the button while listening ends the turn rather than stacking a
    // second recogniser on the same microphone.
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    setError(null);
    setInterim("");

    const recognition = new Ctor();
    recognition.lang = langRef.current;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let live = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          const trimmed = text.trim();
          if (trimmed) commitRef.current(trimmed);
        } else {
          live += text;
        }
      }
      setInterim(live);
    };

    recognition.onerror = (event) => {
      // "aborted" is what a deliberate stop() reports. It is not a failure and
      // must not raise a message the user has to read.
      if (event.error !== "aborted") setError(describe(event.error));
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    setListening(true);

    try {
      recognition.start();
    } catch {
      // Chrome throws if start() lands while a previous session is still
      // winding down. Reset rather than leaving the button stuck lit.
      recognitionRef.current = null;
      setListening(false);
    }
  }, []);

  // A recogniser left running past unmount keeps the microphone indicator lit.
  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, listening, interim, error, start, stop };
}
