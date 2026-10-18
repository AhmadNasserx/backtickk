import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "neutral" | "brand" | "success" | "danger" | "warning";

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: "bg-surface-2 text-muted ring-line",
  brand: "bg-brand/15 text-fg ring-brand/40",
  success: "bg-success/15 text-success ring-success/30",
  danger: "bg-danger/15 text-danger ring-danger/30",
  warning: "bg-warning/15 text-warning ring-warning/30",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
