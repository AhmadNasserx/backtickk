import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "neutral" | "accent" | "brand" | "success" | "danger" | "warning";

// "brand" is kept as an alias of "accent" so existing call sites keep their meaning.
const VARIANTS: Record<BadgeVariant, string> = {
  neutral: "bg-surface-2 text-muted ring-line",
  accent: "bg-accent-soft text-accent ring-accent/30",
  brand: "bg-accent-soft text-accent ring-accent/30",
  success: "bg-success/12 text-success ring-success/30",
  danger: "bg-danger/12 text-danger ring-danger/30",
  warning: "bg-warning/12 text-warning ring-warning/30",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[0.6875rem] font-medium tracking-wide uppercase ring-1 ring-inset",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
