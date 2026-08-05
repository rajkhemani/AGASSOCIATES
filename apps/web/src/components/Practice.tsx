import { practiceAreas } from "@/content/site";
import { Reveal } from "./Reveal";
import { TiltCard } from "./TiltCard";
import { Container, MonoLabel } from "./primitives";

export function Practice() {
  return (
    <section
      id="practice"
      className="scroll-mt-24 border-t border-t-[var(--hairline-light)] bg-paper py-24 sm:py-32"
    >
      <Container>
        <Reveal>
          <MonoLabel index="02">Practice areas</MonoLabel>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="type-heading mt-7 max-w-[22ch]">
            Statutory work for lenders, handled as a{" "}
            <span className="type-accent">standing service.</span>
          </h2>
        </Reveal>
        <Reveal delay={110}>
          <p className="type-body mt-7 max-w-[62ch] text-mist-dim">
            Purpose-built for commercial banks, housing finance companies, and
            non-banking financial institutions operating across the Thane and
            Mumbai MMR belt.
          </p>
        </Reveal>

        {/* The grid gap is a hairline drawn by the parent's background showing
            through. Each card therefore has to carry its own opaque ground, or
            tilting it exposes the rule underneath. */}
        <ul className="mt-16 grid gap-px overflow-hidden rounded-xl border border-[var(--hairline-light)] bg-[var(--hairline-light)] sm:grid-cols-2 lg:grid-cols-3">
          {practiceAreas.map((area, i) => (
            <Reveal key={area.id} as="li" delay={Math.min(i, 3) * 50}>
              <TiltCard>
                <div className="p-8">
                  <p className="type-mono-label text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="type-subheading mt-6">{area.title}</h3>
                  <p className="type-body mt-3 text-sm text-mist-dim">
                    {area.body}
                  </p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
