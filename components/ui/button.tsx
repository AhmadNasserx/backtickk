import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

// Touch targets grow to 44px below the sm breakpoint. Press feedback is a small scale-down.
// translate and scale are listed because the lift and the press use those individual properties, not transform.
const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium select-none cursor-pointer transition-[color,background-color,border-color,box-shadow,transform,translate,scale] duration-200 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-colors motion-reduce:active:scale-100";

const VARIANTS: Record<ButtonVariant, string> = {
  // The glow is a box-shadow transition on hover; the inner highlight gives the lime a little depth.
  // `shine` sweeps a light band across on hover; `group` lets icons inside nudge with group-hover.
  primary:
    "group shine bg-accent text-accent-fg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.35)] hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.35),0_8px_28px_-8px_color-mix(in_srgb,var(--color-accent)_70%,transparent)] motion-reduce:hover:translate-y-0",
  secondary:
    "border border-line bg-surface-2 text-fg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] hover:border-line-strong hover:bg-surface-3",
  ghost: "text-muted hover:bg-surface-2 hover:text-fg",
  danger:
    "bg-danger text-bg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.3)] hover:bg-danger/90",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm max-sm:h-11 max-sm:px-4",
  md: "h-10 px-4 text-sm max-sm:h-11",
  lg: "h-12 px-6 text-base",
};

// Shared with <Link> so links can look like buttons without nesting interactive elements.
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}
