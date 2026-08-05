import { firm } from "@/content/site";
import { Container, MonoLabel } from "./primitives";

const credentials = [
  { label: "Jurisdiction", value: firm.jurisdiction },
  { label: "Registration", value: `${firm.barCouncil} — Panel Advocate` },
  { label: "Applicable for", value: "Banks, HFCs, and NBFCs" },
  { label: "Registered office", value: firm.location },
];

export function Coverage() {
  return (
    <section
      id="coverage"
      className="scroll-mt-24 border-t border-t-[var(--hairline-light)] bg-paper py-24 sm:py-32"
    >
      <Container>
        <MonoLabel index="05">Coverage & credentials</MonoLabel>
        <h2 className="type-heading mt-6 max-w-[24ch]">
          Filed where the property sits.
        </h2>

        <dl className="mt-14 grid gap-px overflow-hidden rounded-xl border border-[var(--hairline-light)] bg-[var(--hairline-light)] sm:grid-cols-2">
          {credentials.map((row) => (
            <div key={row.label} className="bg-paper-raised p-8">
              <dt className="type-mono-label text-gold">{row.label}</dt>
              <dd className="type-body mt-4 text-[0.9375rem]">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
