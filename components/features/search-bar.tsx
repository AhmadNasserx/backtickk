"use client";
// Client island: the debounced search writes into the URL, so it needs the browser router and live search params.

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CONTROL_BASE } from "@/components/ui/input";
import { SearchIcon } from "@/components/ui/icons";
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

  return (
    <form role="search" onSubmit={onSubmit} className={cn("relative w-full", className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
      <input
        id={inputId}
        name="search"
        type="search"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => setValue(event.target.value)}
        className={cn(CONTROL_BASE, "h-10 pr-3 pl-9")}
      />
    </form>
  );
}
