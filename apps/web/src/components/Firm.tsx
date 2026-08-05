import { firm, principal, panels } from "@/content/site";
import { Reveal } from "./Reveal";
import { Container, MonoLabel } from "./primitives";

/**
 * The named advocate and existing panel memberships.
 *
 * Banks empanel an individual, not a firm, so the enrolment number and date
 * are on the page rather than buried in the empanelment kit — a credit manager
 * should be able to fill in their form without emailing first.
 */
export function Firm() {
  return (
    <section
      id="firm"
      className="scroll-mt-24 border-t border-t-[var(--hairline-light)] bg-paper py-24 sm:py-32"
    >
      <Container>
        <MonoLabel index="04">The firm</MonoLabel>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <Reveal>
            <h2 className="type-heading">{principal.name}</h2>
            <p className="type-mono-label mt-4 text-gold">{principal.title}</p>

            <dl className="mt-8 space-y-px overflow-hidden rounded-xl border border-[var(--hairline-light)] bg-[var(--hairline-light)]">
              <div className="flex flex-wrap justify-between gap-2 bg-paper-raised px-5 py-4">
                <dt className="type-mono-label text-mist-dim">Enrolment</dt>
                <dd className="font-mono text-sm tabular-nums">
                  {principal.enrolment}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 bg-paper-raised px-5 py-4">
                <dt className="type-mono-label text-mist-dim">Enrolled</dt>
                <dd className="text-sm">{principal.enrolledOn}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 bg-paper-raised px-5 py-4">
                <dt className="type-mono-label text-mist-dim">Bar Council</dt>
                <dd className="text-right text-sm">{firm.barCouncil}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2 bg-paper-raised px-5 py-4">
                <dt className="type-mono-label text-mist-dim">Practising</dt>
                <dd className="text-sm">since {principal.practisingSince}</dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={80}>
            <p className="type-body text-lg text-mist-dim">{principal.bio}</p>
            <p className="type-body mt-6 text-mist-dim">
              {principal.associates}
            </p>

            <div className="mt-12 border-t border-t-[var(--hairline-light)] pt-10">
              <p className="type-mono-label text-gold">{panels.eyebrow}</p>
              <h3 className="mt-5 text-lg leading-snug font-medium tracking-tight">
                {panels.heading}
              </h3>
              <p className="type-body mt-3 text-sm text-mist-dim">
                {panels.body}
              </p>

              <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {panels.institutions.map((name) => (
                  <li
                    key={name}
                    className="type-body flex gap-2.5 text-sm text-ink"
                  >
                    <span aria-hidden className="text-emerald">
                      ·
                    </span>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
