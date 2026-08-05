import type { ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[76rem] px-5 sm:px-8 lg:px-14",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Numbered mono eyebrow — the structural device borrowed from Terminal
 * Industries. The index is decorative, so it is hidden from assistive tech.
 */
export function MonoLabel({
  children,
  index,
  tone = "dark",
  className,
}: {
  children: ReactNode;
  index?: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    // items-start, not items-center: these labels wrap to two lines on narrow
    // screens, and centring the index against the wrapped block leaves it
    // floating between the lines instead of sitting against the first one.
    <p
      className={cn(
        "type-mono-label flex items-start gap-3 leading-[1.5]",
        tone === "dark" ? "text-mist" : "text-mist",
        className,
      )}
    >
      {index && (
        <span aria-hidden className="text-gold">
          {index}
        </span>
      )}
      <span>{children}</span>
    </p>
  );
}

export function SectionHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h2 className={cn("type-heading", className)}>{children}</h2>;
}

type ButtonProps = {
  children: ReactNode;
  href: string;
  variant?: "primary" | "ghost";
  className?: string;
};

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className,
}: ButtonProps) {
  return (
    <a
      href={href}
      className={cn(
        "type-mono-label inline-flex items-center justify-center gap-2 rounded-lg px-6 py-4",
        "transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "active:scale-[0.97]",
        variant === "primary"
          ? "bg-gold text-ink hover:bg-gold-bright"
          : "border border-[var(--hairline-dark)] text-paper hover:border-gold hover:text-gold",
        className,
      )}
    >
      {children}
    </a>
  );
}

/** Hairline rule that reads as a record separator rather than a divider. */
export function Rule({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <hr
      className={cn(
        "border-0 border-t",
        tone === "dark"
          ? "border-t-[var(--hairline-dark)]"
          : "border-t-[var(--hairline-light)]",
      )}
    />
  );
}
