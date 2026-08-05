"use client";

import { useRef } from "react";
import { m, useScroll, useTransform } from "motion/react";
import { coverage, firm } from "@/content/site";
import { Reveal } from "./Reveal";
import { TiltCard } from "./TiltCard";
import { Container, MonoLabel } from "./primitives";
import { useDepth } from "./motion";

/**
 * Coverage, drawn as territory.
 *
 * A dark console inset into the light page. The ground is a grid plane raked
 * back toward a lit horizon, so the section reads as a map rather than three
 * more cards — which is the actual claim being made: the firm files where the
 * property sits, across a described radius.
 *
 * The inset is what makes the depth legible at all: the engraved grid is drawn
 * in light hairlines and would be invisible on the paper ground.
 */
export function Coverage() {
  const ref = useRef<HTMLDivElement>(null);
  const depth = useDepth();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // The plane flattens slightly and the grid drifts over it as the panel
  // crosses the viewport — travel over terrain, not a texture sliding by.
  const rake = useTransform(scrollYProgress, [0, 1], [64 - 6 * depth, 52]);
  const drift = useTransform(scrollYProgress, [0, 1], ["-14%", "14%"]);

  return (
    <section
      id="coverage"
      className="scroll-mt-24 border-t border-t-[var(--hairline-light)] bg-paper py-24 sm:py-32"
    >
      <Container>
        <Reveal>
          <MonoLabel index="06">{coverage.eyebrow}</MonoLabel>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="type-heading mt-7 max-w-[22ch]">
            Filed <span className="type-accent">where the property sits.</span>
          </h2>
        </Reveal>
        <Reveal delay={110}>
          <p className="type-body mt-7 max-w-[62ch] text-mist-dim">
            {coverage.body}
          </p>
        </Reveal>

        <div
          ref={ref}
          className="grain relative mt-14 overflow-hidden rounded-2xl border border-[var(--hairline-dark)] bg-ink px-6 py-14 sm:px-10 sm:py-20"
        >
          {/* Ground plane, a sibling of the content rather than its ancestor so
              the raked grid can never end up as a transformed parent of the
              copy. The drift layer rides inside the rotated plane, so it
              travels along the ground rather than across the screen. */}
          <div
            aria-hidden
            className="rig pointer-events-none absolute inset-x-0 bottom-0 h-[70%] [perspective-origin:50%_0%]"
          >
            <m.div
              style={{ rotateX: rake }}
              className="absolute inset-x-[-40%] bottom-0 h-[160%] origin-bottom"
            >
              <m.div
                style={{ y: drift }}
                className="engrave-fine absolute inset-x-0 -inset-y-1/2 [mask-image:linear-gradient(to_bottom,transparent,black_55%)]"
              />
            </m.div>
          </div>

          {/* The light the floor is read by. Anchored to the bottom edge where
              the plane actually is — a horizon placed mid-panel would sit
              behind the cards and never be seen. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(70%_100%_at_50%_100%,rgb(201_162_39/0.13),transparent_72%)]"
          />

          <dl className="relative grid gap-px overflow-hidden rounded-xl border border-[var(--hairline-dark)] bg-[var(--hairline-dark)] lg:grid-cols-3">
            {coverage.areas.map((area, i) => (
              <Reveal key={area.label} delay={Math.min(i, 3) * 60}>
                <TiltCard tone="dark">
                  <div className="p-8">
                    <dt className="type-mono-label text-gold">{area.label}</dt>
                    <dd className="type-body mt-4 text-[0.9375rem] text-paper">
                      {area.value}
                    </dd>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </dl>
        </div>

        <p className="type-mono-label mt-10 text-mist-dim">
          Registered office · {firm.location}
        </p>
      </Container>
    </section>
  );
}
