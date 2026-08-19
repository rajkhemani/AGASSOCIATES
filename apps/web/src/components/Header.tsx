"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  m,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { firm, nav } from "@/content/site";
import { cn } from "./primitives";

/**
 * Scroll-driven header.
 *
 * Two behaviours off one scroll subscription:
 *  - past 48px the bar contracts into a floating pill (the Terminal Industries
 *    pattern);
 *  - scrolling down retracts it entirely, scrolling up brings it back, so the
 *    tall sections are read against a clean top edge.
 *
 * Both commit to state only when a threshold is actually crossed, so ordinary
 * scrolling costs no renders. The header is fixed and out of flow, so nothing
 * here can reflow the page below.
 */
export function Header() {
  const [floating, setFloating] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;

    setFloating((was) => (was === y > 48 ? was : y > 48));

    // A menu that scrolls away under the user's thumb is a trap. The 8px
    // deadband below keeps trackpad jitter from flickering the bar.
    if (menuOpen) return;
    const delta = y - previous;
    if (Math.abs(delta) < 8) return;
    const next = delta > 0 && y > 260;
    setHidden((was) => (was === next ? was : next));
  });

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <m.header
      // The bar retracts on scroll but its links stay in the tab sequence, so
      // a keyboard user can land on a control that is off-screen. Any focus
      // reaching the header brings it back.
      onFocusCapture={() => setHidden(false)}
      animate={{ y: hidden ? "-135%" : "0%" }}
      transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-x-0 top-0 z-50 pt-3 sm:pt-4"
    >
      <div
        className={cn(
          "mx-auto flex items-center gap-4 px-4 sm:px-6",
          "transition-[max-width,background-color,border-color,padding,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
          floating
            ? "max-w-[72rem] rounded-2xl border border-[var(--hairline-dark)] bg-ink/95 py-2.5 shadow-[0_8px_32px_rgb(6_9_13/0.35)] backdrop-blur-xl"
            : "max-w-[80rem] rounded-2xl border border-transparent bg-transparent py-4",
        )}
      >
        <a
          href="#main"
          className="flex items-center gap-3"
          aria-label={`${firm.name} — home`}
        >
          <span className="type-mono-label grid h-9 w-9 place-items-center rounded-md bg-gold text-ink">
            AG
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm leading-tight font-medium tracking-tight text-paper">
              {firm.name}
            </span>
            <span className="type-mono-label block text-[0.5625rem] text-mist">
              Banking Advocates
            </span>
          </span>
        </a>

        <nav aria-label="Primary" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="type-mono-label rounded-md px-3 py-2.5 text-mist transition-colors duration-150 hover:text-paper"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Hidden on the narrowest screens — the mobile nav carries it there,
            and three controls in a 390px bar leaves nothing legible. */}
        <a
          href="#empanelment"
          className={cn(
            "type-mono-label ml-auto hidden rounded-lg bg-gold px-4 py-3 text-ink sm:inline-flex md:ml-0",
            "transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "hover:bg-gold-bright active:scale-[0.97]",
          )}
        >
          Empanelment
        </a>

        <button
          type="button"
          onClick={() => {
            setHidden(false);
            setMenuOpen((v) => !v);
          }}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          className="type-mono-label ml-auto rounded-lg border border-[var(--hairline-dark)] px-4 py-3 text-paper transition-colors duration-150 hover:border-gold sm:ml-0 md:hidden"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <m.nav
            id="mobile-nav"
            aria-label="Primary mobile"
            initial={{ opacity: 0, y: -10, rotateX: -14 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: -10, rotateX: -14 }}
            transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformPerspective: 900, transformOrigin: "top center" }}
            className="mx-4 mt-2 rounded-2xl border border-[var(--hairline-dark)] bg-ink/95 p-2 backdrop-blur-xl md:hidden"
          >
            <ul>
              <li className="sm:hidden">
                <a
                  href="#empanelment"
                  onClick={() => setMenuOpen(false)}
                  className="type-mono-label m-2 block rounded-lg bg-gold px-4 py-4 text-center text-ink"
                >
                  Empanelment
                </a>
              </li>
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="type-mono-label block rounded-lg px-4 py-4 text-mist transition-colors duration-150 hover:bg-white/5 hover:text-paper"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </m.nav>
        )}
      </AnimatePresence>
    </m.header>
  );
}
