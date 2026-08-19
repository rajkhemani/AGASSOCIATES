/**
 * Split point for Motion's DOM feature bundle.
 *
 * Kept in its own module purely so `LazyMotion` can pull it in with a dynamic
 * import — importing `domAnimation` directly from the provider would bundle the
 * features into the entry chunk and defeat the whole point of LazyMotion.
 */
export { domAnimation as default } from "motion/react";
