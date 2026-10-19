"use client";
// Client boundary: useSession() and signOut() run in the browser, and the dropdown needs open state and keyboard handling.

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { buttonClasses } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/ui/icons";

const ITEM =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent";
const ITEM_ICON = "size-4 shrink-0 text-subtle";
const MENUITEM_SELECTOR = '[role="menuitem"]';

export function UserMenu() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  // Storing the path the menu was opened on closes it automatically after any navigation.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const focusFirstOnOpen = useRef(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpenPath(null);
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpenPath(null);
      triggerRef.current?.focus();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false;
      menuRef.current?.querySelector<HTMLElement>(MENUITEM_SELECTOR)?.focus();
    }
  }, [open]);

  function focusFirstItem() {
    menuRef.current?.querySelector<HTMLElement>(MENUITEM_SELECTOR)?.focus();
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    if (open) {
      focusFirstItem();
    } else {
      focusFirstOnOpen.current = true;
      setOpenPath(pathname);
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(MENUITEM_SELECTOR) ?? []);
    if (items.length === 0) return;

    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: number | null = null;
    if (event.key === "ArrowDown") next = index < 0 ? 0 : (index + 1) % items.length;
    else if (event.key === "ArrowUp") next = index <= 0 ? items.length - 1 : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;

    if (next !== null) {
      event.preventDefault();
      items[next].focus();
    }
  }

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
      <Link href="/signin" className={buttonClasses("secondary", "sm", "h-11 px-4 sm:h-8 sm:px-3 shrink-0")}>
        Sign in
      </Link>
    );
  }

  const displayName = user.name ?? user.username;
  const close = () => setOpenPath(null);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu for ${displayName}`}
        onClick={() => setOpenPath(open ? null : pathname)}
        onKeyDown={onTriggerKeyDown}
        className="inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Avatar name={displayName} src={user.image} size="md" />
      </button>

      {open ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-60 rounded-xl border border-line bg-surface p-1 shadow-xl shadow-black/30">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-fg">{displayName}</p>
            <p className="truncate font-mono text-xs text-subtle">@{user.username}</p>
          </div>
          <div className="my-1 h-px bg-line" aria-hidden="true" />
          <div
            id={menuId}
            ref={menuRef}
            role="menu"
            aria-label="Account"
            onKeyDown={onMenuKeyDown}
            className="flex flex-col"
          >
            <Link role="menuitem" href="/dashboard" className={ITEM} onClick={close}>
              <LayoutDashboardIcon aria-hidden="true" className={ITEM_ICON} />
              Dashboard
            </Link>
            <Link role="menuitem" href="/settings" className={ITEM} onClick={close}>
              <SettingsIcon aria-hidden="true" className={ITEM_ICON} />
              Settings
            </Link>
            <Link
              role="menuitem"
              href={`/profile/${encodeURIComponent(user.username)}`}
              className={ITEM}
              onClick={close}
            >
              <UserIcon aria-hidden="true" className={ITEM_ICON} />
              Profile
            </Link>
            <div className="my-1 h-px bg-line" role="separator" />
            <button
              type="button"
              role="menuitem"
              className={ITEM}
              onClick={() => signOut({ redirectTo: "/" })}
            >
              <LogOutIcon aria-hidden="true" className={ITEM_ICON} />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
