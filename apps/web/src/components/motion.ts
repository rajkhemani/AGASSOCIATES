"use client";

import { useEffect, useRef, useState } from "react";
import {
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

/**
 * Global motion intensity, 0–1.
 *
 * Every 3D rotation in the site is written at its full desktop magnitude and
 * multiplied by this, so depth is tuned in one place instead of being
 * re-specified per breakpoint:
 *
 *   0     prefers-reduced-motion — all rotation collapses to flat
 *   0.55  handheld — the same rig at a shallower angle, because a 14° tilt that
 *         reads as depth on a 27" panel reads as a rendering fault at 390px
 *   1     desktop
 *
 * Starts at 1 to match the server render, then corrects on mount. The initial
 * frame is at scroll position 0 where the rigs are near-identity anyway, so the
 * correction is not visible.
 */
export function useDepth(): number {
  const reduced = useReducedMotion();
  const [handheld, setHandheld] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setHandheld(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  if (reduced) return 0;
  return handheld ? 0.55 : 1;
}

/** True only for devices that can actually hover with a precise pointer. */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFine(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return fine;
}

interface Tilt {
  ref: React.RefObject<HTMLDivElement | null>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  /** 0–100% coordinates for a sheen highlight that tracks the cursor. */
  sheenX: MotionValue<string>;
  sheenY: MotionValue<string>;
  /** Whether the pointer is currently over the element. */
  active: boolean;
}

/**
 * Pointer-tracked 3D tilt for a single card.
 *
 * Pointer position is held in MotionValues and never in state, so tracking the
 * cursor costs no React renders — only a compositor-thread transform update.
 * Springs are stiff and heavily damped: the card should feel like it is
 * resisting the cursor, not floating after it.
 *
 * Inert on touch devices and under reduced motion.
 */
export function usePointerTilt(maxDegrees = 9): Tilt {
  const ref = useRef<HTMLDivElement>(null);
  const depth = useDepth();
  const fine = useFinePointer();
  const enabled = fine && depth > 0;

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const [active, setActive] = useState(false);

  const range = maxDegrees * depth;
  const rotateY = useSpring(useTransform(px, [0, 1], [-range, range]), {
    stiffness: 260,
    damping: 26,
  });
  const rotateX = useSpring(useTransform(py, [0, 1], [range, -range]), {
    stiffness: 260,
    damping: 26,
  });

  const sheenX = useTransform(px, (v) => `${v * 100}%`);
  const sheenY = useTransform(py, (v) => `${v * 100}%`);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;

    const onMove = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      px.set((event.clientX - box.left) / box.width);
      py.set((event.clientY - box.top) / box.height);
    };
    const onEnter = () => setActive(true);
    const onLeave = () => {
      setActive(false);
      px.set(0.5);
      py.set(0.5);
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerenter", onEnter);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, px, py]);

  return { ref, rotateX, rotateY, sheenX, sheenY, active };
}

/**
 * Scroll progress smoothed by a spring.
 *
 * Lenis already eases the scroll position itself, so this is deliberately stiff
 * — it exists to take the stair-stepping out of trackpad and mouse-wheel input,
 * not to add a second layer of easing on top of Lenis.
 */
export function useSmoothProgress(progress: MotionValue<number>) {
  return useSpring(progress, { stiffness: 180, damping: 34, restDelta: 0.0005 });
}
