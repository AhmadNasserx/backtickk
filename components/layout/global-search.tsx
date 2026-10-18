"use client";
// Client boundary: the form submits by calling router.push, which only exists in the browser.

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CONTROL_BASE } from "@/components/ui/input";
import { SearchIcon } from "@/components/ui/icons";

const INPUT_ID = "global-search";

export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = String(new FormData(event.currentTarget).get("search") ?? "").trim();
    router.push(term ? `/blogs?search=${encodeURIComponent(term)}` : "/blogs");
  }

  return (
    <form role="search" onSubmit={onSubmit} className={cn("relative min-w-0", className)}>
      <label htmlFor={INPUT_ID} className="sr-only">
        Search posts
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
      <input
        id={INPUT_ID}
        name="search"
        type="search"
        placeholder="Search posts…"
        autoComplete="off"
        className={cn(CONTROL_BASE, "h-9 pr-3 pl-9")}
      />
    </form>
  );
}
