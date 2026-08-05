"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger offset in ms. Keep under ~240ms total across a group. */
  delay?: number;
  as?: ElementType;
  className?: string;
}

/**
 * Fade-and-lift on first entry into the viewport.
 *
 * Content renders visible and only becomes hidden once this has mounted, so a
 * JS failure leaves a readable page rather than a blank one. Fires once.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState("shown");
      return;
    }

    setState("hidden");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setState("shown");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={className}
      data-reveal={state === "idle" ? undefined : state}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
