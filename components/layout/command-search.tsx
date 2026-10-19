"use client";
// Client boundary: the / and Ctrl/⌘K shortcuts need window key listeners, and the live results need client state.

import { useEffect, useRef } from "react";
import { SearchCombobox } from "@/components/layout/search-combobox";
import { cn } from "@/lib/utils";

export function CommandSearch({ className }: { className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      const input = inputRef.current;
      // Hidden below the lg breakpoint, so there is nothing to focus and the key must pass through.
      if (!input || input.offsetParent === null) return;

      const commandK =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const slash =
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget(event.target);
      if (!commandK && !slash) return;

      event.preventDefault();
      input.focus();
      input.select();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <SearchCombobox
      label="Search posts and communities"
      placeholder="Search posts and communities"
      inputRef={inputRef}
      keyShortcuts="/ Control+K Meta+K"
      formClassName={cn("group relative min-w-0", className)}
      inputClassName="h-10 w-full rounded-xl border border-line bg-surface pr-14 pl-9 text-sm text-fg placeholder:text-subtle transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      onEscape={() => inputRef.current?.blur()}
      trailing={
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 items-center rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] leading-none text-subtle md:inline-flex"
        >
          ⌘K
        </kbd>
      }
    />
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}
