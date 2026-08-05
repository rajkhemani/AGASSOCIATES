"use client";

import { useEffect, useRef, useState } from "react";
import { workflows } from "@/content/workflows";
import type { Workflow } from "@/types";
import { Container, MonoLabel, cn } from "./primitives";

/**
 * The documented workflows, rendered as a scroll-driven stepper.
 *
 * INTERACTION MODEL: scroll-driven via IntersectionObserver — deliberately not
 * a tab bar. These are linear statutory processes; a tabbed UI would imply the
 * stages are independent and selectable, which misrepresents them. The rail
 * entries are anchor links so keyboard users still get direct navigation.
 */
export function ProcessExplorer() {
  const [workflowIndex, setWorkflowIndex] = useState(0);
  const workflow = workflows[workflowIndex];

  return (
    <section id="process" className="scroll-mt-24 bg-ink py-24 text-paper sm:py-32">
      <Container>
        <MonoLabel index="03">Documented process</MonoLabel>
        <h2 className="type-heading mt-6 max-w-[24ch]">
          Every file moves through a written procedure.
        </h2>
        <p className="type-body mt-6 max-w-[62ch] text-mist">
          Each of these workflows exists as a standard operating procedure the
          firm maintains internally. Published here is the process shape a
          lending team needs in order to plan around it.
        </p>

        {/* Workflow selection IS a real choice between three separate
            documents, so this one is legitimately click-driven. */}
        <div
          role="tablist"
          aria-label="Workflow"
          className="mt-12 flex flex-wrap gap-2"
        >
          {workflows.map((w, i) => (
            <button
              key={w.slug}
              role="tab"
              type="button"
              aria-selected={i === workflowIndex}
              onClick={() => setWorkflowIndex(i)}
              className={cn(
                "type-mono-label rounded-lg border px-4 py-3",
                "transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "active:scale-[0.97]",
                i === workflowIndex
                  ? "border-gold bg-gold text-ink"
                  : "border-[var(--hairline-dark)] text-mist hover:border-gold hover:text-paper",
              )}
            >
              {w.name}
            </button>
          ))}
        </div>

        <WorkflowPanel key={workflow.slug} workflow={workflow} />
      </Container>
    </section>
  );
}

function WorkflowPanel({ workflow }: { workflow: Workflow }) {
  const [active, setActive] = useState(0);
  const stageRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const nodes = stageRefs.current.filter(Boolean) as HTMLLIElement[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the viewport midline rather than the first
        // intersecting one — otherwise fast scrolls land on the wrong stage.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = nodes.indexOf(visible.target as HTMLLIElement);
        if (index >= 0) setActive(index);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [workflow.slug]);

  return (
    <div className="mt-12">
      <p className="type-body max-w-[62ch] text-mist">{workflow.summary}</p>

      {/* Hand-off chain */}
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

      <div className="mt-14 grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-16">
        {/* Sticky rail — unpins below lg */}
        <nav aria-label={`${workflow.name} stages`} className="lg:sticky lg:top-28 lg:self-start">
          <ol className="hidden lg:block">
            {workflow.stages.map((stage, i) => (
              <li key={stage.title}>
                <a
                  href={`#${workflow.slug}-${i}`}
                  aria-current={i === active ? "step" : undefined}
                  className={cn(
                    "flex gap-3 border-l py-2.5 pl-4 text-sm transition-[color,border-color] duration-200",
                    i === active
                      ? "border-l-gold text-paper"
                      : "border-l-[var(--hairline-dark)] text-mist-dim hover:text-mist",
                  )}
                >
                  <span className="type-mono-label pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-snug">{stage.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <ol className="space-y-px">
          {workflow.stages.map((stage, i) => (
            <li
              key={stage.title}
              id={`${workflow.slug}-${i}`}
              ref={(node) => {
                stageRefs.current[i] = node;
              }}
              className={cn(
                "scroll-mt-28 border-t border-t-[var(--hairline-dark)] py-8 transition-opacity duration-300",
                i === active ? "opacity-100" : "lg:opacity-45",
              )}
            >
              <MonoLabel index={String(i + 1).padStart(2, "0")}>
                {stage.title}
              </MonoLabel>
              <p className="type-body mt-4 max-w-[58ch] text-mist">
                {stage.body}
              </p>

              {stage.detail && (
                <div className="mt-6 rounded-lg border border-[var(--hairline-dark)] p-5">
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
          ))}
        </ol>
      </div>

      {/* Asides — only rendered for workflows that carry them */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {[workflow.trigger, workflow.compliance, workflow.records]
          .filter((aside) => aside !== undefined)
          .map((aside) => (
            <div
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
            </div>
          ))}
      </div>
    </div>
  );
}
