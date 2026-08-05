import { faq } from "@/content/site";
import { Reveal } from "./Reveal";
import { Container, MonoLabel } from "./primitives";

/**
 * Failure modes, not marketing.
 *
 * Native <details> rather than a JS accordion: it is keyboard accessible and
 * searchable in-page by default, works with JS disabled, and this content is
 * read once rather than toggled repeatedly — so an animation would be noise.
 */
export function Faq() {
  return (
    <section
      id="faq"
      className="scroll-mt-24 bg-ink py-24 text-paper sm:py-32"
    >
      <Container>
        <MonoLabel index="07">{faq.eyebrow}</MonoLabel>
        <h2 className="type-heading mt-6 max-w-[22ch]">{faq.heading}</h2>
        <p className="type-body mt-6 max-w-[62ch] text-mist">{faq.body}</p>

        <div className="mt-14 max-w-[64rem]">
          {faq.items.map((item, i) => (
            <Reveal key={item.q} delay={Math.min(i, 3) * 50}>
              <details className="group border-t border-t-[var(--hairline-dark)]">
                <summary className="flex cursor-pointer list-none items-baseline gap-4 py-6 transition-colors duration-150 hover:text-gold [&::-webkit-details-marker]:hidden">
                  <span className="type-mono-label text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-lg leading-snug font-medium tracking-tight">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="type-mono-label text-mist transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="type-body max-w-[62ch] pb-8 pl-[3.25rem] text-mist">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
          <div className="border-t border-t-[var(--hairline-dark)]" />
        </div>
      </Container>
    </section>
  );
}
