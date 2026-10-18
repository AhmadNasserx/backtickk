"use client";
// Client boundary: useSession() and signOut() run in the browser, and the dropdown needs open state.

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { buttonClasses } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const MENU_LINK =
  "block rounded-lg px-3 py-2 text-sm text-fg transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (status === "loading") {
    return (
      <span
        role="status"
        aria-label="Loading account"
        className="size-8 shrink-0 animate-pulse rounded-full bg-surface-2"
      />
    );
  }

  const user = session?.user;
  if (!user) {
    return (
      <Link href="/signin" className={buttonClasses("secondary", "sm", "shrink-0")}>
        Sign in
      </Link>
    );
  }

  const displayName = user.name ?? user.username;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${displayName}`}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Avatar name={displayName} src={user.image} size="md" />
      </button>

      {open ? (
        <div
          id={menuId}
          className="absolute top-full right-0 z-50 mt-2 w-56 rounded-xl border border-line bg-surface p-1 shadow-2xl shadow-black/40"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-fg">{displayName}</p>
            <p className="truncate text-xs text-subtle">@{user.username}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link href="/dashboard" className={MENU_LINK} onClick={() => setOpen(false)}>
            Dashboard
          </Link>
          <Link href="/settings" className={MENU_LINK} onClick={() => setOpen(false)}>
            Settings
          </Link>
          <Link
            href={`/profile/${encodeURIComponent(user.username)}`}
            className={MENU_LINK}
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            onClick={() => signOut({ redirectTo: "/" })}
            className={`${MENU_LINK} w-full text-left`}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
