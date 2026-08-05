import { coverage, firm } from "@/content/site";
import { Reveal } from "./Reveal";
import { Container, MonoLabel } from "./primitives";

export function Coverage() {
  return (
    <section
      id="coverage"
      className="scroll-mt-24 border-t border-t-[var(--hairline-light)] bg-paper py-24 sm:py-32"
    >
      <Container>
        <MonoLabel index="06">{coverage.eyebrow}</MonoLabel>
        <h2 className="type-heading mt-6 max-w-[24ch]">{coverage.heading}</h2>
        <p className="type-body mt-6 max-w-[62ch] text-mist-dim">
          {coverage.body}
        </p>

        <dl className="mt-14 grid gap-px overflow-hidden rounded-xl border border-[var(--hairline-light)] bg-[var(--hairline-light)] lg:grid-cols-3">
          {coverage.areas.map((area, i) => (
            <Reveal
              key={area.label}
              delay={Math.min(i, 3) * 50}
              className="bg-paper-raised p-8"
            >
              <dt className="type-mono-label text-gold">{area.label}</dt>
              <dd className="type-body mt-4 text-[0.9375rem]">{area.value}</dd>
            </Reveal>
          ))}
        </dl>

        <p className="type-mono-label mt-10 text-mist-dim">
          Registered office · {firm.location}
        </p>
      </Container>
    </section>
  );
}
