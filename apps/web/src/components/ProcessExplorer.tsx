"use client";

import { useEffect, useRef, useState } from "react";
import {
  m,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { workflows } from "@/content/workflows";
import type { Workflow, WorkflowStage } from "@/types";
import { Container, MonoLabel, cn } from "./primitives";
import { Reveal } from "./Reveal";
import { useDepth, useSmoothProgress } from "./motion";

/**
 * The documented workflows, rendered as a scroll-driven filing rig.
 *
 * INTERACTION MODEL: the stage copy is ordinary flowing content and the 3D deck
 * beside it is a sticky visual bound to scroll position. That split is
 * deliberate — the deck is a facsimile carrying no prose, so it is hidden from
 * assistive technology, and every word a user needs stays in normal document
 * order where it is selectable, findable with ⌘F, and legible with JS disabled.
 *
 * Choosing *between* workflows is a real choice between three separate SOPs, so
 * that part is legitimately click-driven and implemented as proper tabs.
 */
export function ProcessExplorer() {
  const [index, setIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Roving focus. Tabs are a single tab stop; arrows move between them.
  const onKeyDown = (event: React.KeyboardEvent) => {
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + workflows.length) % workflows.length;
    setIndex(next);
    tabRefs.current[next]?.focus();
  };

  const workflow = workflows[index];

  return (
    <section
      id="process"
      className="grain relative scroll-mt-24 bg-ink pt-24 pb-28 text-paper sm:pt-32"
    >
      <div
        aria-hidden
        className="engrave pointer-events-none absolute inset-0 opacity-60"
      />

      <Container className="relative">
        <Reveal>
          <MonoLabel index="03">Documented process</MonoLabel>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="type-heading mt-7 max-w-[20ch]">
            Every file moves through a{" "}
            <span className="type-accent">written procedure.</span>
          </h2>
        </Reveal>
        <Reveal delay={110}>
          <p className="type-body mt-7 max-w-[62ch] text-mist">
            Each of these workflows exists as a standard operating procedure the
            firm maintains internally. Published here is the process shape a
            lending team needs in order to plan around it.
          </p>
        </Reveal>

        <div
          role="tablist"
          aria-label="Workflow"
          onKeyDown={onKeyDown}
          className="mt-12 flex flex-wrap gap-2"
        >
          {workflows.map((w, i) => (
            <button
              key={w.slug}
              ref={(node) => {
                tabRefs.current[i] = node;
              }}
              role="tab"
              type="button"
              id={`tab-${w.slug}`}
              aria-selected={i === index}
              aria-controls={`panel-${w.slug}`}
              tabIndex={i === index ? 0 : -1}
              onClick={() => setIndex(i)}
              className={cn(
                "type-mono-label rounded-lg border px-4 py-3",
                "transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "active:scale-[0.97]",
                i === index
                  ? "border-gold bg-gold text-ink"
                  : "border-[var(--hairline-dark)] text-mist hover:border-gold hover:text-paper",
              )}
            >
              {w.name}
            </button>
          ))}
        </div>
      </Container>

      <WorkflowScene key={workflow.slug} workflow={workflow} />
    </section>
  );
}

function WorkflowScene({ workflow }: { workflow: Workflow }) {
  const ref = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const total = workflow.stages.length;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const smooth = useSmoothProgress(scrollYProgress);

  // Scroll progress at which each stage block reaches the reading line.
  //
  // Mapping progress to stage linearly is only correct when the blocks are
  // evenly spread across the container — true at lg, where each is min-h-76vh,
  // and false below it, where the pinned deck eats the top of the container and
  // the blocks are their natural height. Left linear, the readout and the plate
  // run a full stage ahead of the copy they are meant to be describing on
  // handheld. Measuring the blocks makes the mapping correct at every width.
  const [stops, setStops] = useState<number[]>([]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      const blocks = Array.from(
        node.querySelectorAll<HTMLElement>("[data-stage-block]"),
      );
      const range = node.offsetHeight - window.innerHeight;
      if (blocks.length !== total || range <= 0) {
        setStops([]);
        return;
      }

      // Below lg the deck is pinned across the top, so the copy is read in the
      // band beneath it rather than at the centre of the viewport.
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      const deck = wide ? 0 : (deckRef.current?.offsetHeight ?? 0);
      const line = deck + (window.innerHeight - deck) / 2;

      const top = node.getBoundingClientRect().top + window.scrollY;
      setStops(
        blocks.map((block) => {
          const centre =
            block.getBoundingClientRect().top +
            window.scrollY +
            block.offsetHeight / 2;
          return (centre - line - top) / range;
        }),
      );
    };

    measure();
    // Catches the reflow when the webfonts land, as well as resize and rotate.
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [total]);

  // The single value the whole scene reads from: a continuous stage position.
  // Plates interpolate against it; the readout rounds it. Measured stops are
  // monotonic by construction, which is what useTransform requires.
  const usable = stops.length === total;
  const stage = useTransform(
    smooth,
    usable ? stops : [0, 1],
    usable ? stops.map((_, i) => i) : [0, total - 1],
    { clamp: true },
  );

  const [active, setActive] = useState(0);
  useMotionValueEvent(stage, "change", (v) => {
    const next = Math.round(v);
    setActive((prev) => (prev === next ? prev : next));
  });

  return (
    <div
      role="tabpanel"
      id={`panel-${workflow.slug}`}
      aria-labelledby={`tab-${workflow.slug}`}
      tabIndex={0}
    >
      <Container className="relative">
        <p className="type-body mt-14 max-w-[62ch] text-mist">
          {workflow.summary}
        </p>

        <ol className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-3">
          {workflow.chain.map((node, i) => (
            <li key={`${node}-${i}`} className="flex items-center gap-2">
              <span className="type-mono-label rounded-md border border-[var(--hairline-dark)] px-3 py-2 text-mist">
                {node}
              </span>
              {i < workflow.chain.length - 1 && (
                <span aria-hidden className="text-gold">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </Container>

      {/* The scrollytelling block. Copy flows; the deck is pinned beside it. */}
      <Container>
        <div
          ref={ref}
          className="mt-16 lg:grid lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-16"
        >
          {/* Handheld: the deck pins under the header and the copy runs beneath
              it. The offset clears the floating header pill — at top-16 the
              plate's leading edge slides under the bar at the end of the
              sticky range. */}
          <div
            ref={deckRef}
            className="sticky top-20 z-10 -mx-5 mb-6 bg-ink/85 px-5 pt-4 pb-5 backdrop-blur-md sm:-mx-8 sm:px-8 lg:top-0 lg:z-0 lg:mx-0 lg:mb-0 lg:flex lg:h-screen lg:items-center lg:bg-transparent lg:px-0 lg:backdrop-blur-none"
          >
            <Deck
              workflow={workflow}
              stage={stage}
              active={active}
              total={total}
            />
          </div>

          <ol className="relative">
            {workflow.stages.map((s, i) => (
              <StageBlock
                key={s.title}
                stage={s}
                index={i}
                total={total}
                active={i === active}
                slug={workflow.slug}
              />
            ))}
          </ol>
        </div>
      </Container>

      <Container>
        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {[workflow.trigger, workflow.compliance, workflow.records]
            .filter((aside) => aside !== undefined)
            .map((aside) => (
              <Reveal
                key={aside.label}
                className="rounded-xl border border-[var(--hairline-dark)] p-6"
              >
                <p className="type-mono-label text-gold">{aside.label}</p>
                <ul className="mt-4 space-y-2">
                  {aside.items.map((item) => (
                    <li
                      key={item}
                      className="type-body flex gap-2.5 text-sm text-mist"
                    >
                      <span aria-hidden className="text-emerald-bright">
                        ·
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
        </div>
      </Container>
    </div>
  );
}

/**
 * The deck.
 *
 * Facsimile documents suspended in one shared 3D space. Queued plates recede
 * behind the active one so the stack has visible volume; completed plates come
 * forward past the camera and fade out — the direction of travel says "filed"
 * rather than "dismissed".
 *
 * Hidden from assistive technology: it duplicates the stage list beside it and
 * carries no text of its own beyond the stage title.
 */
function Deck({
  workflow,
  stage,
  active,
  total,
}: {
  workflow: Workflow;
  stage: MotionValue<number>;
  active: number;
  total: number;
}) {
  const railScale = useTransform(stage, [0, total - 1], [0, 1]);

  return (
    <div className="w-full">
      <div
        aria-hidden
        className="rig relative h-[42vh] w-full sm:h-[46vh] lg:h-[30rem]"
      >
        <div className="plate absolute inset-0">
          {workflow.stages.map((s, i) => (
            <Plate
              key={s.title}
              title={s.title}
              index={i}
              total={total}
              stage={stage}
            />
          ))}
        </div>
      </div>

      {/* Readout. The only part of the deck that is not decorative — it states
          position in the sequence, which the flowing copy does not. */}
      <div className="mt-4 flex items-center gap-4 lg:mt-8">
        <p className="type-mono-label text-gold">
          Stage {String(active + 1).padStart(2, "0")}
          <span className="text-mist-dim"> / {String(total).padStart(2, "0")}</span>
        </p>
        <div className="h-px flex-1 bg-[var(--hairline-dark)]">
          <m.div
            style={{ scaleX: railScale }}
            className="h-full origin-left bg-gold"
          />
        </div>
      </div>
    </div>
  );
}

function Plate({
  title,
  index,
  total,
  stage,
}: {
  title: string;
  index: number;
  total: number;
  stage: MotionValue<number>;
}) {
  const depth = useDepth();
  const last = index === total - 1;

  // Keyframes are anchored on this plate's own index, so the same curve
  // describes every plate: three positions back in the queue, in focus, and
  // one position past. Everything outside that clamps.
  const key = [
    index - 3,
    index - 2,
    index - 1,
    index - 0.55,
    index,
    index + 0.3,
    index + 0.75,
  ];
  const scaled = (frames: number[]) => frames.map((v) => v * depth);

  // Departure goes down and slightly back, never toward the camera. A plate
  // travelling forward grows larger than the one taking focus and frames it
  // like a mat board; sliding it away reads as filing rather than dismissal.
  const z = useTransform(
    stage,
    key,
    scaled([-560, -380, -190, -70, 0, -30, -110]),
    { clamp: true },
  );
  const y = useTransform(stage, key, scaled([-128, -88, -46, -18, 0, 74, 168]), {
    clamp: true,
  });
  const rotateX = useTransform(
    stage,
    key,
    scaled([15, 12, 7, 2.5, 0, -10, -20]),
    { clamp: true },
  );
  const rotateZ = useTransform(
    stage,
    key,
    scaled([-5, -4, -2.4, -0.9, 0, 2, 4.5]),
    { clamp: true },
  );

  // The plateau between t=-0.55 and t=0 is what stops the queue bleeding
  // through the plate in focus. Without it the active plate is only briefly at
  // full opacity and spends most of its dwell slightly transparent, letting the
  // document behind it show through its face.
  //
  // With depth at 0 the plates lose their Z separation and land on top of one
  // another, so the queue has to stop being drawn at all — that is the
  // reduced-motion presentation: a plain card swap.
  const opacity = useTransform(
    stage,
    key,
    depth ? [0, 0.3, 0.62, 1, 1, 0.42, 0] : [0, 0, 0, 1, 1, 0, 0],
    { clamp: true },
  );

  return (
    <m.div
      style={{ z, y, rotateX, rotateZ, opacity }}
      className="absolute inset-x-0 top-1/2 mx-auto aspect-[1.42/1] w-full max-w-[26rem] -translate-y-1/2 rounded-lg bg-[#f2efe6] p-5 shadow-[0_40px_80px_-24px_rgb(0_0_0/0.9)] sm:p-6"
    >
      {/* Warm paper against the ink void. Reversing the plates out of the dark
          ground is what makes the stack read as physical documents at a glance
          — a dark-on-dark card at 34% opacity just reads as a rendering fault. */}
      <div className="flex items-center justify-between border-b border-b-ink/15 pb-3">
        <span className="type-mono-label text-[#8a6d12]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            last ? "bg-emerald" : "bg-[#8a6d12]/50",
          )}
        />
      </div>

      <p className="type-subheading mt-4 text-ink">{title}</p>

      {/* Ruled body. Hairlines rather than lorem text — a facsimile should not
          put unreadable pseudo-prose in front of the reader. */}
      <div className="mt-5 space-y-2.5">
        {[100, 88, 94, 62].map((width, i) => (
          <div
            key={i}
            style={{ width: `${width}%` }}
            className="h-px bg-ink/12"
          />
        ))}
      </div>

      {last && (
        <span className="type-mono-label absolute right-5 bottom-5 rotate-[-9deg] rounded-md border-2 border-emerald px-2.5 py-1.5 text-emerald sm:right-6 sm:bottom-6">
          Registered
        </span>
      )}
    </m.div>
  );
}

function StageBlock({
  stage,
  index,
  total,
  active,
  slug,
}: {
  stage: WorkflowStage;
  index: number;
  total: number;
  active: boolean;
  slug: string;
}) {
  return (
    <li
      id={`${slug}-${index}`}
      data-stage-block
      className={cn(
        "scroll-mt-28 border-t border-t-[var(--hairline-dark)] py-10",
        "lg:flex lg:min-h-[76vh] lg:flex-col lg:justify-center lg:border-t-0 lg:py-0",
        "transition-opacity duration-500",
        active ? "opacity-100" : "lg:opacity-30",
      )}
    >
      <MonoLabel index={String(index + 1).padStart(2, "0")}>
        {index === total - 1 ? "Closure" : "Stage"}
      </MonoLabel>

      <h3 className="type-subheading mt-5 text-paper">{stage.title}</h3>

      <p className="type-body mt-4 max-w-[52ch] text-mist">{stage.body}</p>

      {stage.detail && (
        <div className="mt-6 max-w-[36rem] rounded-lg border border-[var(--hairline-dark)] p-5">
          <p className="type-mono-label text-gold">
            {stage.detailLabel ?? "Includes"}
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {stage.detail.map((item) => (
              <li
                key={item}
                className="type-body flex gap-2.5 text-sm text-mist"
              >
                <span aria-hidden className="text-emerald-bright">
                  ·
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
