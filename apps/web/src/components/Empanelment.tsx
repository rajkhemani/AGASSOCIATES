"use client";

import { useState } from "react";
import { contact, firm } from "@/content/site";
import { Container, MonoLabel, cn } from "./primitives";

/**
 * Empanelment enquiry.
 *
 * The site is a static export with no backend, so this composes a mailto:
 * draft rather than pretending to submit. That is stated in the UI — a form
 * that silently goes nowhere is worse than no form.
 */
export function Empanelment() {
  const [caseType, setCaseType] = useState<string>(
    contact.fields.caseTypes[0],
  );

  return (
    <section
      id="empanelment"
      className="scroll-mt-24 bg-ink py-24 text-paper sm:py-32"
    >
      <Container>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <MonoLabel index="08">{contact.eyebrow}</MonoLabel>
            <h2 className="type-heading mt-6 max-w-[18ch]">
              {contact.heading}
            </h2>
            <p className="type-body mt-6 max-w-[48ch] text-mist">
              {contact.body}
            </p>
            <p className="type-mono-label mt-10 text-mist-dim">
              {firm.name} · {firm.location}
            </p>
          </div>

          <form
            action={`mailto:${firm.email}`}
            method="post"
            encType="text/plain"
            className="rounded-xl border border-[var(--hairline-dark)] p-6 sm:p-8"
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

            <div className="mt-8 grid gap-5">
              <Field name="institution" label="Institution" required />
              <Field name="name" label="Contact name" required />
              <Field name="email" label="Work email" type="email" required />
              <Field name="volume" label="Approximate monthly volume" />
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

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="type-mono-label text-mist">
        {label}
        {required && (
          <span aria-hidden className="ml-1 text-gold">
            *
          </span>
        )}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        className={cn(
          "mt-3 w-full rounded-sm border border-[var(--hairline-dark)] bg-transparent px-4 py-3.5",
          "text-[0.9375rem] text-paper placeholder:text-mist-dim",
          "transition-colors duration-150 focus:border-gold focus:outline-none",
        )}
      />
    </label>
  );
}
