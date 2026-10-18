import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-xl border border-line bg-surface text-fg", className)}
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
      className={cn("text-base font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export type CardContentProps = HTMLAttributes<HTMLDivElement>;

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn("px-5 py-4 sm:px-6", className)} {...props} />;
}
