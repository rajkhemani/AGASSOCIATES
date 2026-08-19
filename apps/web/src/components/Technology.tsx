"use client";

import { useRef } from "react";
import { m, useScroll, useTransform } from "motion/react";
import { automation } from "@/content/site";
import { Reveal } from "./Reveal";
import { TiltCard } from "./TiltCard";
import { Container, MonoLabel } from "./primitives";
import { useDepth } from "./motion";

/**
 * The automation console.
 *
 * The four steps sit on one plane that starts raked away from the viewer and
 * levels out as the section crosses the viewport — a single scroll subscription
 * and a single transform for the whole group rather than one per card. The rake
 * resolves to flat by the time the group is centred, so no one ever has to read
 * body copy at an angle.
 */
export function Technology() {
  const ref = useRef<HTMLDivElement>(null);
  const depth = useDepth();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [17 * depth, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [40 * depth, 0]);

  return (
    <section
      id="technology"
      className="scroll-mt-24 border-t border-t-[var(--hairline-light)] bg-paper py-24 sm:py-32"
    >
      <Container>
        <Reveal>
          <MonoLabel index="05">{automation.eyebrow}</MonoLabel>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="type-heading mt-7 max-w-[22ch]">
            Deterministic automation,{" "}
            <span className="type-accent">lawyer-reviewed output.</span>
          </h2>
        </Reveal>
        <Reveal delay={110}>
          <p className="type-body mt-7 max-w-[62ch] text-mist-dim">
            {automation.body}
          </p>
        </Reveal>

        <div ref={ref} className="rig mt-16">
          <m.ul
            style={{ rotateX, y }}
            className="grid origin-bottom gap-px overflow-hidden rounded-xl border border-[var(--hairline-light)] bg-[var(--hairline-light)] sm:grid-cols-2"
          >
            {automation.items.map((item, i) => (
              <li key={item.title}>
                <TiltCard>
                  <div className="p-8">
                    <p className="type-mono-label text-gold">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="type-subheading mt-5">{item.title}</h3>
                    <p className="type-body mt-3 max-w-[46ch] text-sm text-mist-dim">
                      {item.body}
                    </p>
                  </div>
                </TiltCard>
              </li>
            ))}
          </m.ul>
        </div>
      </Container>
    </section>
  );
}
