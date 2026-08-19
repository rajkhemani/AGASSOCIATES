"use client";

import { m, useScroll } from "motion/react";
import { useSmoothProgress } from "./motion";

/**
 * Document progress, rendered as an instrument rather than a decoration.
 *
 * A single gold hairline across the top edge. `scaleX` on a
 * `transform-origin: left` element, so it is a compositor-only property and
 * never triggers layout at any scroll position.
 *
 * Kept out of the accessibility tree: it reports scroll position, which
 * assistive technology already conveys, and announcing a value that changes on
 * every frame would be hostile.
 */
export function ScrollRail() {
  const { scrollYProgress } = useScroll();
  const progress = useSmoothProgress(scrollYProgress);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-100 h-px bg-[var(--hairline-dark)]"
    >
      <m.div
        style={{ scaleX: progress }}
        className="h-full origin-left bg-linear-to-r from-gold via-gold-bright to-emerald-bright"
      />
    </div>
  );
}
