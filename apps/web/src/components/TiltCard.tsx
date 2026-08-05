"use client";

import type { ReactNode } from "react";
import { m, useMotionTemplate } from "motion/react";
import { usePointerTilt } from "./motion";
import { cn } from "./primitives";

/**
 * A card that turns to face the cursor.
 *
 * The tilt is the whole point of the surface treatment, so the sheen is bound
 * to the same pointer position that drives the rotation — a highlight that
 * tracks the light source the card is turning under. Both are MotionValues, so
 * following the cursor costs zero React renders.
 *
 * On touch and under reduced motion `usePointerTilt` returns resting values and
 * this degrades to a plain card with a hover background — no dead interaction
 * affordance left behind.
 */
export function TiltCard({
  children,
  className,
  tone = "light",
}: {
  children: ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  const { ref, rotateX, rotateY, sheenX, sheenY, active } = usePointerTilt(8);

  const sheen = useMotionTemplate`radial-gradient(24rem 24rem at ${sheenX} ${sheenY}, rgb(201 162 39 / ${
    tone === "dark" ? 0.16 : 0.13
  }), transparent 62%)`;

  return (
    <div ref={ref} className={cn("rig-near h-full", className)}>
      <m.div
        style={{ rotateX, rotateY }}
        className={cn(
          "plate relative h-full",
          tone === "dark" ? "bg-ink-raised" : "bg-paper-raised",
        )}
      >
        {/* Sheen sits above the ground and below the copy. */}
        <m.div
          aria-hidden
          style={{ background: sheen, opacity: active ? 1 : 0 }}
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        />
        {/* Content is pushed toward the viewer so it parallaxes against the
            card face as the card turns, instead of being painted flat on it. */}
        <div className="relative h-full [transform:translateZ(28px)]">
          {children}
        </div>
      </m.div>
    </div>
  );
}
