"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Deferred so the feature bundle lands in its own chunk and is fetched after
 * first paint rather than blocking it. Until it resolves, `m` components render
 * as plain elements with their initial styles — which is exactly the state the
 * page should be in before anything has scrolled.
 */
const loadFeatures = () =>
  import("./motion-features").then((mod) => mod.default);

/**
 * Motion runtime for the whole site.
 *
 * `domAnimation` rather than the full feature bundle: this site animates only
 * transform and opacity, so layout projection, drag, and the SVG path features
 * would be dead weight. It is loaded asynchronously (see `loadFeatures`) so it
 * does not sit in the entry chunk at all.
 *
 * `strict` makes that saving enforceable — it throws on any `motion.*` import,
 * which would silently pull the full bundle back in. Everything downstream uses
 * the `m.*` components instead.
 *
 * `reducedMotion="user"` covers declarative animations (`animate`, `whileInView`).
 * It deliberately does NOT cover scroll-linked `style={{ rotateX: someValue }}`
 * bindings, because those are driven by MotionValues the config never sees —
 * `useDepth()` in ./motion is what neutralises those.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
