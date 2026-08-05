import { practiceAreas } from "@/content/site";
import { Reveal } from "./Reveal";
import { Container, MonoLabel } from "./primitives";

export function Practice() {
  return (
    <section
      id="practice"
      className="scroll-mt-24 border-t border-t-[var(--hairline-light)] bg-paper py-24 sm:py-32"
    >
      <Container>
        <MonoLabel index="02">Practice areas</MonoLabel>
        <h2 className="type-heading mt-6 max-w-[26ch]">
          Statutory work for lenders, handled as a standing service.
        </h2>
        <p className="type-body mt-6 max-w-[62ch] text-mist-dim">
          Purpose-built for commercial banks, housing finance companies, and
          non-banking financial institutions operating across the Thane and
          Mumbai MMR belt.
        </p>

        <ul className="mt-16 grid gap-px overflow-hidden rounded-xl border border-[var(--hairline-light)] bg-[var(--hairline-light)] sm:grid-cols-2 lg:grid-cols-3">
          {practiceAreas.map((area, i) => (
            <Reveal
              key={area.id}
              as="li"
              delay={Math.min(i, 3) * 50}
              className="group bg-paper-raised p-8 transition-colors duration-150 hover:bg-paper"
            >
              <p className="type-mono-label text-gold">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-6 text-lg leading-snug font-medium tracking-tight">
                {area.title}
              </h3>
              <p className="type-body mt-3 text-sm text-mist-dim">{area.body}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
