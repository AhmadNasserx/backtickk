import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-line px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? <div className="text-subtle [&_svg]:size-8">{icon}</div> : null}
      <h2 className="text-base font-semibold text-fg">{title}</h2>
      {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
