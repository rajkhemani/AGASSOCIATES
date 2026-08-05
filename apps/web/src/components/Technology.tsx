import { automation } from "@/content/site";
import { Reveal } from "./Reveal";
import { Container, MonoLabel } from "./primitives";

export function Technology() {
  return (
    <section
      id="technology"
      className="scroll-mt-24 border-t border-t-[var(--hairline-light)] bg-paper py-24 sm:py-32"
    >
      <Container>
        <MonoLabel index="05">{automation.eyebrow}</MonoLabel>
        <h2 className="type-heading mt-6 max-w-[24ch]">{automation.heading}</h2>
        <p className="type-body mt-6 max-w-[62ch] text-mist-dim">
          {automation.body}
        </p>

        <ul className="mt-16 grid gap-8 sm:grid-cols-2 lg:gap-12">
          {automation.items.map((item, i) => (
            <Reveal
              key={item.title}
              as="li"
              delay={Math.min(i, 3) * 50}
              className="border-t border-t-[var(--hairline-light)] pt-6"
            >
              <p className="type-mono-label text-gold">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-5 text-lg leading-snug font-medium tracking-tight">
                {item.title}
              </h3>
              <p className="type-body mt-3 max-w-[46ch] text-sm text-mist-dim">
                {item.body}
              </p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
