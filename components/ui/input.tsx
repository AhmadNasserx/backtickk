import { cloneElement, type InputHTMLAttributes, type ReactElement } from "react";
import { cn } from "@/lib/utils";

// Appearance only. Size and padding are added by each control, because cn() does not merge conflicting utilities.
export const CONTROL_BASE =
  "w-full min-w-0 rounded-lg border border-line bg-surface-2 text-sm text-fg placeholder:text-subtle transition-colors hover:border-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(CONTROL_BASE, "h-10 px-3", className)}
      {...props}
    />
  );
}

// Props Field injects into its single control; any control that forwards id/aria props works.
export type FieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

export type FieldProps = {
  /** Also the control's id, which the label and error text reference. */
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  className?: string;
  /** A single control element, e.g. <Input name="title" />. */
  children: ReactElement<FieldControlProps>;
};

export function Field({ id, label, hint, error, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [children.props["aria-describedby"], hintId, errorId].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      {cloneElement(children, {
        id,
        "aria-invalid": error ? true : children.props["aria-invalid"],
        "aria-describedby": describedBy,
      })}
      {hint ? (
        <p id={hintId} className="text-xs text-subtle">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} aria-live="polite" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
