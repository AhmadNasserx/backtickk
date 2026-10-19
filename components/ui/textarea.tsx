import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { CONTROL_BASE } from "@/components/ui/input";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, rows = 5, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        CONTROL_BASE,
        "min-h-24 resize-y px-3.5 py-2.5 leading-6 text-base sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}
