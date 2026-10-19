import { cn } from "@/lib/utils";

// One slanted stroke, drawn as a path so the glyph is identical in every font and at every size.
const GLYPH_PATH = "M14.5 9.25 9.5 14.75";

// Server Components: the logo is static markup, so it adds nothing to a page's client bundle.

/** The lime tile with the dark backtick glyph. Decorative: the link around it carries the name. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-accent-fg",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={GLYPH_PATH} />
      </svg>
    </span>
  );
}

/** The mark followed by the lowercase wordmark. A lime dot closes the word as the accent. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-[22px] leading-none tracking-[-0.02em] text-fg">
        backtick
        <span
          aria-hidden="true"
          className="ml-1 inline-block size-1.5 rounded-full bg-accent"
        />
      </span>
    </span>
  );
}
