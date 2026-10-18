import { cn } from "@/lib/utils";

export type SpinnerSize = "sm" | "md" | "lg";

const SIZES: Record<SpinnerSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-8",
};

export type SpinnerProps = {
  size?: SpinnerSize;
  label?: string;
  className?: string;
};

// A 3/4 ring on a faint track. Spins only when motion is allowed.
export function Spinner({ size = "md", label = "Loading", className }: SpinnerProps) {
  return (
    <span role="status" className={cn("inline-flex shrink-0", className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className={cn("motion-safe:animate-spin text-current", SIZES[size])}
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
