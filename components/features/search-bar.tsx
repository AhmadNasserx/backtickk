"use client";
// Client island: the debounced search writes into the URL, so it needs the browser router and live search params.

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CONTROL_BASE } from "@/components/ui/input";
import { SearchIcon, XIcon } from "@/components/ui/icons";
import { cn, withParams } from "@/lib/utils";

const DEBOUNCE_MS = 300;

/** Sets or clears `search`, keeps every other param and drops `page` so results start at the first page. */
function searchHref(pathname: string, searchParams: URLSearchParams, term: string): string {
  const params = Object.fromEntries(searchParams.entries());
  return `${pathname}${withParams(params, { search: term || null, page: null })}`;
}

export type SearchBarProps = {
  label: string;
  placeholder?: string;
  className?: string;
};

export function SearchBar({ label, placeholder, className }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const current = searchParams.get("search") ?? "";
  const [value, setValue] = useState(current);
  const term = value.trim();
  // The last term this bar pushed. Its own navigation must not overwrite what the user is still typing.
  const lastPushed = useRef<string | null>(null);

  useEffect(() => {
    if (current === lastPushed.current) return;
    // The URL changed from elsewhere (for example "Clear filters"), so show the new value.
    setValue(current);
  }, [current]);

  useEffect(() => {
    if (term === current) return;
    const timer = setTimeout(() => {
      lastPushed.current = term;
      router.push(searchHref(pathname, searchParams, term));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term, current, pathname, searchParams, router]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    lastPushed.current = term;
    router.push(searchHref(pathname, searchParams, term));
  }

  function clear() {
    setValue("");
    lastPushed.current = "";
    router.push(searchHref(pathname, searchParams, ""));
    inputRef.current?.focus();
  }

  return (
    <form role="search" onSubmit={onSubmit} className={cn("relative w-full", className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
      <input
        ref={inputRef}
        id={inputId}
        name="search"
        type="search"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        onChange={(event) => setValue(event.target.value)}
        className={cn(
          CONTROL_BASE,
          "h-11 pr-11 pl-10 sm:h-10 [&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={clear}
          className="absolute top-1/2 right-1 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-3 hover:text-fg sm:size-8"
        >
          <XIcon className="size-4" />
        </button>
      ) : null}
    </form>
  );
}
