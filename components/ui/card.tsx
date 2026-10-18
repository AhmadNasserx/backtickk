import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Adds the lift + lime beam hover treatment (for clickable cards). */
  interactive?: boolean;
};

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface text-fg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]",
        interactive && "card-hover",
        className,
      )}
      {...props}
    />
  );
}

export type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-b border-line px-5 py-4 sm:px-6",
        className,
      )}
      {...props}
    />
  );
}

export type CardTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  as?: "h2" | "h3" | "h4" | "p";
};

export function CardTitle({ as: Tag = "h2", className, ...props }: CardTitleProps) {
  return (
    <Tag
      className={cn("text-base font-semibold tracking-tight text-fg", className)}
      {...props}
    />
  );
}

export type CardContentProps = HTMLAttributes<HTMLDivElement>;

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn("px-5 py-4 sm:px-6", className)} {...props} />;
}
