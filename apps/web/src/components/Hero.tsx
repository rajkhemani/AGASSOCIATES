"use client";

import { useRef } from "react";
import { m, useScroll, useTransform } from "motion/react";
import { firm, hero, figures } from "@/content/site";
import { ButtonLink, Container, MonoLabel } from "./primitives";
import { useDepth } from "./motion";

/** Lines flip up into place like plates settling. */
const LINE_IN = {
  hidden: { rotateX: -82, y: "42%", opacity: 0 },
  shown: { rotateX: 0, y: "0%", opacity: 1 },
};

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const depth = useDepth();

  // Drives the camera pull-back. Ends at "end start" — by the time the hero's
  // bottom edge reaches the top of the viewport the rig is fully receded, so
  // nothing keeps animating off-screen.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // The whole rig tips away from the viewer and sinks. Reads as a camera
  // craning back rather than content scrolling under a mask.
  const rigRotate = useTransform(scrollYProgress, [0, 1], [0, 9 * depth]);
  const rigZ = useTransform(scrollYProgress, [0, 1], [0, -260 * depth]);
  const rigFade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  // Three grounds at different depths. The far grid barely moves, the near one
  // overtakes the content — the parallax spread is what sells the volume.
  const farY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const midY = useTransform(scrollYProgress, [0, 1], ["0%", "34%"]);
  const nearY = useTransform(scrollYProgress, [0, 1], ["0%", "62%"]);
  const washScale = useTransform(scrollYProgress, [0, 1], [1, 1.35]);

  return (
    <section
      ref={ref}
      className="rig grain relative isolate overflow-hidden bg-ink pt-32 pb-20 text-paper sm:pt-40 sm:pb-28"
    >
      {/* --- Grounds. Ordered far to near; none intercept pointer events. --- */}
      <m.div
        aria-hidden
        style={{ y: farY }}
        className="engrave pointer-events-none absolute -inset-x-[10%] -inset-y-[20%] -z-30 opacity-70"
      />
      <m.div
        aria-hidden
        style={{ y: midY, scale: washScale }}
        className="pointer-events-none absolute -inset-x-[10%] -inset-y-[20%] -z-20 bg-[radial-gradient(115%_75%_at_50%_-5%,rgb(201_162_39/0.22),transparent_62%)]"
      />
      <m.div
        aria-hidden
        style={{ y: nearY }}
        className="engrave-fine pointer-events-none absolute -inset-x-[10%] -inset-y-[20%] -z-10 [mask-image:radial-gradient(70%_50%_at_50%_20%,black,transparent)]"
      />
      {/* Horizon. A single lit edge low in the frame gives the void a floor. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-linear-to-r from-transparent via-gold/35 to-transparent"
      />

      <m.div
        style={{ rotateX: rigRotate, z: rigZ, opacity: rigFade }}
        className="plate origin-top"
      >
        <Container className="relative">
          <m.div
            data-enter
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <MonoLabel index="01">{hero.eyebrow}</MonoLabel>
          </m.div>

          {/* Each line owns its own 3D space and hinges on its baseline. The
              clipping wrapper is what makes it read as a plate rotating up out
              of the surface rather than a word tumbling in mid-air. */}
          <h1 className="type-display mt-8 max-w-[16ch] [perspective:800px]">
            {[hero.headlineLead, hero.headlineAccent].map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.12em]">
                <m.span
                  data-enter
                  variants={LINE_IN}
                  initial="hidden"
                  animate="shown"
                  transition={{
                    duration: 1.05,
                    delay: 0.12 + i * 0.11,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={
                    i === 1
                      ? "type-accent block origin-bottom"
                      : "block origin-bottom"
                  }
                >
                  {line}
                </m.span>
              </span>
            ))}
          </h1>

          <m.p
            data-enter
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42, ease: [0.23, 1, 0.32, 1] }}
            className="type-body mt-8 max-w-[56ch] text-lg text-mist"
          >
            {hero.body}
          </m.p>

          <m.div
            data-enter
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.52, ease: [0.23, 1, 0.32, 1] }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <ButtonLink href={hero.primaryCta.href}>
              {hero.primaryCta.label}
            </ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} variant="ghost">
              {hero.secondaryCta.label}
            </ButtonLink>
          </m.div>

          <Figures />

          <m.p
            data-enter
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="type-mono-label mt-10 text-mist-dim"
          >
            {firm.barCouncil} · {firm.servesLabel}
          </m.p>
        </Container>
      </m.div>
    </section>
  );
}

/**
 * The operating figures, set on a plane raked away from the viewer.
 *
 * The rake is the point: it makes the row read as a physical instrument panel
 * laid into the surface rather than four boxes. Each cell then lifts back
 * toward the viewer in Z on hover, which only resolves as motion *because* the
 * plane it sits in is angled.
 */
function Figures() {
  const depth = useDepth();

  return (
    // The rake and the corner clipping have to live on different elements:
    // `overflow: hidden` forces transform-style back to flat, so a perspective
    // declared outside the clip never reaches the cells. The clip stays here,
    // and the grid inside carries its own perspective.
    <m.div
      data-enter
      initial={{ opacity: 0, y: 26, rotateX: 12 * depth }}
      animate={{ opacity: 1, y: 0, rotateX: 7 * depth }}
      transition={{ duration: 0.9, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformPerspective: 1200 }}
      className="rimlight mt-16 origin-bottom overflow-hidden rounded-xl border border-[var(--hairline-dark)]"
    >
      <dl className="rig-near grid grid-cols-2 gap-px bg-[var(--hairline-dark)] lg:grid-cols-4">
        {figures.map((figure, i) => (
          <m.div
            key={figure.label}
            data-enter
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.72 + i * 0.06 }}
            whileHover={
              depth ? { z: 34, backgroundColor: "#111820" } : undefined
            }
            className="bg-ink p-6"
          >
            <dd className="flex items-baseline gap-1.5">
              <span className="font-display text-5xl leading-none tracking-[-0.03em] text-paper tabular-nums">
                {figure.value}
              </span>
              <span className="type-mono-label text-gold">{figure.unit}</span>
            </dd>
            <dt className="type-mono-label mt-4 text-paper">{figure.label}</dt>
            <p className="type-body mt-2 text-sm text-mist-dim">{figure.note}</p>
          </m.div>
        ))}
      </dl>
    </m.div>
  );
}
