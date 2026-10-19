import { cn } from "@/lib/utils";

export type FormErrorProps = {
  message?: string | null;
  className?: string;
};

// role="alert" makes screen readers announce server errors as soon as they appear.
export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm leading-6 text-danger",
        className,
      )}
    >
      {message}
    </div>
  );
}
