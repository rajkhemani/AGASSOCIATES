import { firm, nav } from "@/content/site";
import { workflows } from "@/content/workflows";
import { Container } from "./primitives";

export function Footer() {
  return (
    <footer className="border-t border-t-[var(--hairline-dark)] bg-ink-sunken py-16 text-paper">
      <Container>
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-medium tracking-tight">{firm.name}</p>
            <p className="type-body mt-3 max-w-[28ch] text-sm text-mist-dim">
              {firm.tagline}
            </p>
            <p className="type-mono-label mt-6 text-mist-dim">
              {firm.location}
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="type-mono-label text-gold">Sections</p>
            <ul className="mt-5 space-y-3">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-mist transition-colors duration-150 hover:text-paper"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="type-mono-label text-gold">Workflows</p>
            <ul className="mt-5 space-y-3">
              {workflows.map((w) => (
                <li key={w.slug}>
                  <a
                    href="#process"
                    className="text-sm text-mist transition-colors duration-150 hover:text-paper"
                  >
                    {w.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="type-mono-label text-gold">Enquiries</p>
            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href={`mailto:${firm.email}`}
                  className="text-sm text-mist transition-colors duration-150 hover:text-paper"
                >
                  {firm.email}
                </a>
              </li>
              <li>
                <a
                  href="#empanelment"
                  className="text-sm text-mist transition-colors duration-150 hover:text-paper"
                >
                  Bank empanelment
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-t-[var(--hairline-dark)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-mono-label text-mist-dim">
            © {new Date().getFullYear()} {firm.name}
          </p>
          <p className="type-body max-w-[62ch] text-xs text-mist-dim">
            This website is informational and does not constitute legal advice
            or solicitation. Published in accordance with the Bar Council of
            India Rules.
          </p>
        </div>
      </Container>
    </footer>
  );
}
