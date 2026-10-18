"use client";
// Client island: the count-up needs the browser. The server HTML already holds the final number, so the page reads correctly without JS.

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const DURATION_MS = 900;

const format = (value: number) => value.toLocaleString("en-US");

// Exponential ease-out: a quick start that settles slowly on the final value.
function easeOutExpo(progress: number): number {
  return progress >= 1 ? 1 : 1 - Math.pow(2, -10 * progress);
}

/**
 * Shows `value` and, once the element scrolls into view, counts up to it from 0 (one time).
 * The text is written straight to the DOM, so the count does not re-render React.
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || value <= 0 || typeof IntersectionObserver === "undefined") {
      // Writing the text keeps the DOM correct when `value` changes, because React's own text node was replaced.
      element.textContent = format(value);
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        element.textContent = format(0);
        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION_MS, 1);
          element.textContent = format(Math.round(value * easeOutExpo(progress)));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {format(value)}
    </span>
  );
}
