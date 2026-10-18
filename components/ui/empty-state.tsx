import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  /** Replaces the default terminal motif. */
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

// Default illustration: a mono terminal window. Decorative, so hidden from assistive tech.
function TerminalMotif() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="size-12"
    >
      <rect x="5" y="9" width="38" height="30" rx="6" />
      <path d="M5 16h38" />
      <path d="m13 24 4 3.5-4 3.5" />
      <path d="M22 31h8" />
    </svg>
  );
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface/50 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="text-subtle">{icon ?? <TerminalMotif />}</div>
      <h2 className="font-display text-2xl leading-tight text-fg text-balance">{title}</h2>
      {description ? (
        <p className="max-w-sm text-sm leading-6 text-muted text-pretty">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
