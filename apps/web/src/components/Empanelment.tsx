"use client";

import { useRef, useState } from "react";
import { contact, firm } from "@/content/site";
import { Reveal } from "./Reveal";
import { Container, MonoLabel, cn } from "./primitives";
import { useDictation } from "./useDictation";
import { spellForSpeech, useSpeech } from "./useSpeech";

/**
 * Empanelment enquiry.
 *
 * The site is a static export with no backend, so this composes a mailto:
 * draft rather than pretending to submit. That is stated in the UI — a form
 * that silently goes nowhere is worse than no form.
 *
 * Fields accept dictation through the browser's own speech recogniser. That
 * choice follows from the same constraint: there is no server here to send
 * audio to, and the recogniser the browser already ships handles the languages
 * these enquiries arrive in. Where it is absent the microphone simply does not
 * render and the form behaves exactly as it did before.
 */
export function Empanelment() {
  const [caseType, setCaseType] = useState<string>(
    contact.fields.caseTypes[0],
  );
  const [lang, setLang] = useState<string>(contact.dictation.languages[0].code);
  // Off by default, always. A page that starts talking unasked is a problem
  // in the open-plan offices this audience reads it from.
  const [readback, setReadback] = useState(false);

  return (
    <section
      id="empanelment"
      className="grain relative scroll-mt-24 bg-ink py-24 text-paper sm:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_60%_at_80%_0%,rgb(201_162_39/0.13),transparent_65%)]"
      />
      <Container className="relative">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Reveal>
              <MonoLabel index="08">{contact.eyebrow}</MonoLabel>
            </Reveal>
            <Reveal delay={60}>
              <h2 className="type-heading mt-7 max-w-[16ch]">
                Add AG Associates{" "}
                <span className="type-accent">to your panel.</span>
              </h2>
            </Reveal>
            <Reveal delay={110}>
              <p className="type-body mt-7 max-w-[48ch] text-mist">
                {contact.body}
              </p>
            </Reveal>
            <p className="type-mono-label mt-10 text-mist-dim">
              {firm.name} · {firm.location}
            </p>
          </div>

          <form
            action={`mailto:${firm.email}`}
            method="post"
            encType="text/plain"
            className="rimlight rounded-xl border border-[var(--hairline-dark)] bg-ink-raised/60 p-6 sm:p-8"
          >
            <fieldset>
              <legend className="type-mono-label text-gold">
                Requirement
              </legend>
              <div className="mt-5 flex flex-wrap gap-2">
                {contact.fields.caseTypes.map((type) => (
                  <label
                    key={type}
                    className={cn(
                      "type-mono-label cursor-pointer rounded-lg border px-4 py-3",
                      "transition-[background-color,border-color,color] duration-150",
                      caseType === type
                        ? "border-gold bg-gold text-ink"
                        : "border-[var(--hairline-dark)] text-mist hover:border-gold hover:text-paper",
                    )}
                  >
                    <input
                      type="radio"
                      name="requirement"
                      value={type}
                      checked={caseType === type}
                      onChange={() => setCaseType(type)}
                      className="sr-only"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </fieldset>

            <LanguagePicker
              value={lang}
              onChange={setLang}
              readback={readback}
              onReadbackChange={setReadback}
            />

            <div className="mt-6 grid gap-5">
              <Field
                name="institution"
                label="Institution"
                lang={lang}
                readback={readback}
                required
              />
              <Field
                name="name"
                label="Contact name"
                lang={lang}
                readback={readback}
                required
              />
              <Field
                name="email"
                label="Work email"
                type="email"
                lang={lang}
                readback={readback}
                required
              />
              <Field
                name="volume"
                label="Approximate monthly volume"
                lang={lang}
                readback={readback}
              />
            </div>

            <button
              type="submit"
              className={cn(
                "type-mono-label mt-8 w-full rounded-lg bg-gold px-6 py-4 text-ink",
                "transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "hover:bg-gold-bright active:scale-[0.97]",
              )}
            >
              Request empanelment kit
            </button>

            <p className="type-body mt-4 text-xs text-mist-dim">
              Opens a pre-filled email in your mail client. No data is
              transmitted from this page.
            </p>
          </form>
        </div>
      </Container>
    </section>
  );
}

/**
 * Which language the recogniser should expect.
 *
 * A native select rather than a custom listbox: it is four options, it must be
 * operable by keyboard on first try, and the platform control already is.
 */
function LanguagePicker({
  value,
  onChange,
  readback,
  onReadbackChange,
}: {
  value: string;
  onChange: (code: string) => void;
  readback: boolean;
  onReadbackChange: (on: boolean) => void;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
      <label className="type-mono-label flex items-center gap-3 text-mist">
        <span>{contact.dictation.label}</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "type-mono-label min-h-11 rounded-sm border border-[var(--hairline-dark)]",
            "bg-ink px-3 py-2 text-paper",
            "transition-colors duration-150 focus:border-gold focus:outline-none",
          )}
        >
          {contact.dictation.languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
            </option>
          ))}
        </select>
      </label>

      {/* A real checkbox, sized to the 44px target rather than a styled div, so
          it is operable by keyboard and reads correctly to assistive tech. */}
      <label className="type-mono-label flex min-h-11 cursor-pointer items-center gap-3 text-mist">
        <input
          type="checkbox"
          checked={readback}
          onChange={(event) => onReadbackChange(event.target.checked)}
          className="size-4 accent-[var(--color-gold)]"
        />
        <span>{contact.dictation.readbackLabel}</span>
      </label>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  lang,
  readback,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  lang: string;
  readback: boolean;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const speech = useSpeech(lang);

  // The input stays uncontrolled so the mailto: serialisation keeps reading it
  // exactly as before. Dictation appends to whatever has been typed rather
  // than replacing it, so speaking after typing corrects nothing by accident.
  const { supported, listening, interim, error, start } = useDictation(
    lang,
    (text) => {
      const input = inputRef.current;
      if (!input) return;
      const existing = input.value.trim();
      input.value = existing ? `${existing} ${text}` : text;
      input.focus();

      // Confirm out loud only when asked. An email is spelled out because it is
      // the field where a single wrong character loses the enquiry outright.
      if (readback && speech.supported) {
        speech.speak(type === "email" ? spellForSpeech(text) : text);
      }
    },
  );

  const status = `${label} dictation`;

  return (
    <div>
      <label className="block">
        <span className="type-mono-label text-mist">
          {label}
          {required && (
            <span aria-hidden className="ml-1 text-gold">
              *
            </span>
          )}
        </span>
        <span className="mt-3 flex items-stretch gap-2">
          <input
            ref={inputRef}
            type={type}
            name={name}
            required={required}
            className={cn(
              "w-full rounded-sm border border-[var(--hairline-dark)] bg-transparent px-4 py-3.5",
              "text-[0.9375rem] text-paper placeholder:text-mist-dim",
              "transition-colors duration-150 focus:border-gold focus:outline-none",
            )}
          />
          {supported && (
            <button
              type="button"
              onClick={start}
              aria-label={
                listening ? `Stop ${status}` : `Dictate ${label.toLowerCase()}`
              }
              aria-pressed={listening}
              className={cn(
                "grid min-h-11 w-11 shrink-0 place-items-center rounded-sm border",
                "transition-[transform,border-color,color,background-color] duration-150",
                "ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]",
                "focus-visible:border-gold focus-visible:outline-none",
                listening
                  ? "border-gold bg-gold text-ink"
                  : "border-[var(--hairline-dark)] text-mist hover:border-gold hover:text-gold",
              )}
            >
              <MicIcon listening={listening} />
            </button>
          )}
        </span>
      </label>

      {/* Polite, not assertive: dictation feedback must not interrupt a screen
          reader mid-field. Rendered always so the region is present before it
          has anything to announce. */}
      <p
        aria-live="polite"
        className={cn(
          "type-body mt-2 min-h-5 text-xs",
          error ? "text-gold-bright" : "text-mist-dim",
        )}
      >
        {error ?? (listening ? interim || "Listening…" : "")}
      </p>
    </div>
  );
}

/**
 * The ring only pulses while listening, and the pulse is dropped entirely under
 * prefers-reduced-motion — the fill change alone already carries the state.
 */
function MicIcon({ listening }: { listening: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      aria-hidden
      className={listening ? "motion-safe:animate-pulse" : undefined}
    >
      <rect x="5.6" y="1.8" width="4.8" height="8" rx="2.4" />
      <path d="M3.2 7.6a4.8 4.8 0 0 0 9.6 0" />
      <path d="M8 12.4v1.8" />
    </svg>
  );
}
