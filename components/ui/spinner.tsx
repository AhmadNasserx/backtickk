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

export function Spinner({ size = "md", label = "Loading", className }: SpinnerProps) {
  return (
    <span role="status" className={cn("inline-flex shrink-0", className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className={cn("animate-spin text-current", SIZES[size])}
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
