"use client";
// Client island: pointer position is only known in the browser. One document listener serves every card, so no per-card state exists and nothing re-renders.

import { useEffect } from "react";

const POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const CARD_SELECTOR = ".card-hover";

/** Renders nothing. Tracks the pointer over `.card-hover` cards and publishes --mx/--my for the CSS spotlight. */
export function Spotlight() {
  useEffect(() => {
    // Touch and reduced-motion visitors never attach the listener, so they pay no per-move cost.
    if (!window.matchMedia(POINTER_QUERY).matches || window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    let frame = 0;
    let card: HTMLElement | null = null;
    let clientX = 0;
    let clientY = 0;

    // Runs at most once per frame, however many pointermove events arrived since the last one.
    const apply = () => {
      frame = 0;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${clientX - rect.left}px`);
      card.style.setProperty("--my", `${clientY - rect.top}px`);
    };

    const onPointerMove = (event: PointerEvent) => {
      const { target } = event;
      if (!(target instanceof Element)) return;
      const hit = target.closest<HTMLElement>(CARD_SELECTOR);
      if (!hit) return;

      card = hit;
      clientX = event.clientX;
      clientY = event.clientY;
      if (frame === 0) frame = requestAnimationFrame(apply);
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
