"use client";
// Client boundary: the search button opens a full-width overlay, which needs open state, focus handling and Escape.

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { blogSearchHref } from "@/data/navigation";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";

const FORM_ID = "mobile-search";
const INPUT_ID = "mobile-search-input";

export function MobileSearch() {
  const router = useRouter();
  const pathname = usePathname();
  // Storing the path the overlay was opened on closes it automatically after any navigation.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = String(new FormData(event.currentTarget).get("search") ?? "");
    setOpenPath(null);
    router.push(blogSearchHref(term));
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") setOpenPath(null);
  }

  return (
    <div className="ml-auto lg:hidden">
      <button
        type="button"
        aria-label="Search posts"
        aria-expanded={open}
        aria-controls={open ? FORM_ID : undefined}
        onClick={() => setOpenPath(open ? null : pathname)}
        className="inline-flex size-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <SearchIcon className="size-5" />
      </button>

      {open ? (
        // Absolute so it covers the sticky top bar it sits in, which is the nearest positioned ancestor.
        <form
          id={FORM_ID}
          role="search"
          onSubmit={onSubmit}
          className="absolute inset-0 z-40 flex items-center gap-2 bg-bg px-4"
        >
          <label htmlFor={INPUT_ID} className="sr-only">
            Search blog posts
          </label>
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
            <input
              ref={inputRef}
              id={INPUT_ID}
              name="search"
              type="search"
              placeholder="Search posts"
              autoComplete="off"
              onKeyDown={onInputKeyDown}
              className="h-11 w-full rounded-xl border border-line bg-surface pr-3 pl-9 text-base text-fg placeholder:text-subtle focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            />
          </div>
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setOpenPath(null)}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <CloseIcon className="size-5" />
          </button>
        </form>
      ) : null}
    </div>
  );
}
