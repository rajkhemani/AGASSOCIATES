import { firm, hero, figures } from "@/content/site";
import { Reveal } from "./Reveal";
import { ButtonLink, Container, MonoLabel } from "./primitives";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink pt-36 pb-20 text-paper sm:pt-44 sm:pb-28">
      {/* Ground wash. Sits behind content, never intercepts pointer events. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgb(201_162_39/0.16),transparent_60%)]"
      />

      <Container className="relative">
        <Reveal>
          <MonoLabel index="01">{hero.eyebrow}</MonoLabel>
        </Reveal>

        <Reveal delay={60}>
          <h1 className="type-display mt-8 max-w-[18ch]">
            {hero.headlineLead}
            <br />
            <span className="text-gold">{hero.headlineAccent}</span>
          </h1>
        </Reveal>

        <Reveal delay={120}>
          <p className="type-body mt-8 max-w-[58ch] text-lg text-mist">
            {hero.body}
          </p>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink href={hero.primaryCta.href}>
              {hero.primaryCta.label}
            </ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} variant="ghost">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={240}>
          <dl className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--hairline-dark)] bg-[var(--hairline-dark)] lg:grid-cols-4">
            {figures.map((figure) => (
              <div key={figure.label} className="bg-ink p-6">
                <dd className="flex items-baseline gap-1.5">
                  <span className="text-4xl leading-none font-medium tracking-[-0.04em] text-paper tabular-nums">
                    {figure.value}
                  </span>
                  <span className="type-mono-label text-gold">
                    {figure.unit}
                  </span>
                </dd>
                <dt className="type-mono-label mt-4 text-paper">
                  {figure.label}
                </dt>
                <p className="type-body mt-2 text-sm text-mist-dim">
                  {figure.note}
                </p>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={300}>
          <p className="type-mono-label mt-10 text-mist-dim">
            {firm.barCouncil} · {firm.servesLabel}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
