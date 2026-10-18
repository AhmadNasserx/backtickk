"use client";
// Client boundary: the / and Ctrl/⌘K shortcuts need window key listeners, and submitting needs the router.

import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { blogSearchHref } from "@/data/navigation";
import { SearchIcon } from "@/components/ui/icons";

const INPUT_ID = "command-search";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function CommandSearch({ className }: { className?: string }) {
  const router = useRouter();
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

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = String(new FormData(event.currentTarget).get("search") ?? "");
    router.push(blogSearchHref(term));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") event.currentTarget.blur();
  }

  return (
    <form role="search" onSubmit={onSubmit} className={cn("group relative min-w-0", className)}>
      <label htmlFor={INPUT_ID} className="sr-only">
        Search blog posts
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle transition-colors group-focus-within:text-accent" />
      <input
        ref={inputRef}
        id={INPUT_ID}
        name="search"
        type="search"
        placeholder="Search posts, tags, authors"
        autoComplete="off"
        aria-keyshortcuts="/ Control+K Meta+K"
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-xl border border-line bg-surface pr-14 pl-9 text-sm text-fg placeholder:text-subtle transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      />
      <kbd
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 items-center rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] leading-none text-subtle md:inline-flex"
      >
        ⌘K
      </kbd>
    </form>
  );
}
