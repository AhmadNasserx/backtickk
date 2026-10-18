"use client";
// Client boundary: the search button opens a full-width overlay, which needs open state, focus handling and Escape.

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SearchCombobox } from "@/components/layout/search-combobox";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";

const FORM_ID = "mobile-search";

export function MobileSearch() {
  const pathname = usePathname();
  // Storing the path the overlay was opened on closes it automatically after any navigation.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function close() {
    setOpenPath(null);
  }

  return (
    <div className="ml-auto lg:hidden">
      <button
        type="button"
        aria-label="Search posts and communities"
        aria-expanded={open}
        aria-controls={open ? FORM_ID : undefined}
        onClick={() => setOpenPath(open ? null : pathname)}
        className="inline-flex size-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <SearchIcon className="size-5" />
      </button>

      {open ? (
        // Absolute so it covers the sticky top bar it sits in, which is the nearest positioned ancestor.
        <SearchCombobox
          id={FORM_ID}
          label="Search posts and communities"
          placeholder="Search posts and communities"
          inputRef={inputRef}
          formClassName="absolute inset-0 z-40 flex items-center gap-2 bg-bg px-4"
          inputClassName="h-11 w-full rounded-xl border border-line bg-surface pr-3 pl-9 text-base text-fg placeholder:text-subtle focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          onNavigate={close}
          onEscape={close}
          trailing={
            <button
              type="button"
              aria-label="Close search"
              onClick={close}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <CloseIcon className="size-5" />
            </button>
          }
        />
      ) : null}
    </div>
  );
}
