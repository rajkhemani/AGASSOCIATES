"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Voices whose names are reliably female on the platforms that ship them.
 *
 * SpeechSynthesisVoice carries no gender field — the spec never defined one —
 * so preference can only be expressed as a name list. Matching is by substring
 * against voice.name, most specific first. Anything not matched falls through
 * to the platform default, which may be any voice at all; that is a limit of
 * the API, not something a longer list would fix.
 */
const FEMALE_VOICE_HINTS: Record<string, string[]> = {
  hi: ["Swara", "Heera", "Kalpana", "Lekha", "Google हिन्दी"],
  mr: ["Aarohi", "Manohar", "Google मराठी"],
  gu: ["Dhwani", "Niranjan"],
  en: ["Neerja", "Heera", "Veena", "Rishi", "Samantha", "Google UK English Female", "Zira"],
};

/** Language-neutral markers, checked after the language-specific list. */
const GENERIC_FEMALE_HINTS = ["female", "woman"];

function pickVoice(voices: SpeechSynthesisVoice[], lang: string) {
  const base = lang.split("-")[0];
  const inLanguage = voices.filter((v) => v.lang.replace("_", "-").startsWith(base));
  const pool = inLanguage.length ? inLanguage : voices;

  for (const hint of FEMALE_VOICE_HINTS[base] ?? []) {
    const match = pool.find((v) => v.name.includes(hint));
    if (match) return match;
  }
  const generic = pool.find((v) =>
    GENERIC_FEMALE_HINTS.some((hint) => v.name.toLowerCase().includes(hint)),
  );
  return generic ?? pool[0] ?? null;
}

export interface Speech {
  /** False where the API or its voice list is unavailable — hide the control. */
  supported: boolean;
  speaking: boolean;
  /** The voice actually chosen, so the UI can name it rather than promise one. */
  voiceName: string | null;
  speak: (text: string) => void;
  cancel: () => void;
}

/**
 * Spoken readback of what dictation understood.
 *
 * Deliberately not an assistant persona. It exists for one job: confirming a
 * transcription out loud, which matters most for the email field, where a
 * silent mistranscription costs the enquiry entirely. Delivery is level and
 * unhurried — this sits on a banking practice's site, and a performed voice
 * would undercut the thing the page is actually selling.
 *
 * Nothing here speaks unless the caller asks it to. There is no autoplay: a
 * page that starts talking on its own is a problem in an open-plan office,
 * which is exactly where this audience reads it.
 */
export function useSpeech(lang: string): Speech {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    // Chrome populates the list asynchronously and fires voiceschanged; Safari
    // has it ready on first call. Handle both rather than assuming either.
    const sync = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      setVoice(pickVoice(voices, langRef.current));
      setSupported(true);
    };

    sync();
    window.speechSynthesis.addEventListener("voiceschanged", sync);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", sync);
      window.speechSynthesis.cancel();
    };
  }, [lang]);

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (!text.trim()) return;

      // A queued backlog would read stale confirmations over the current one.
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langRef.current;
      if (voice) utterance.voice = voice;
      // Slightly under natural pace: this is being checked against what the
      // person just said, not listened to for pleasure.
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [voice],
  );

  return { supported, speaking, voiceName: voice?.name ?? null, speak, cancel };
}

/**
 * Read an email address aloud in a way that survives being heard once.
 *
 * "aditya@kotak.com" spoken literally is a run-on. Punctuation is named and
 * the local part is spaced so each character lands separately — this is the
 * field where a wrong character means the enquiry is never answered.
 */
export function spellForSpeech(value: string): string {
  if (!value.includes("@")) return value;
  const [local, domain = ""] = value.split("@");
  const spaced = local.split("").join(" ");
  return `${spaced} at ${domain.replace(/\./g, " dot ")}`;
}
