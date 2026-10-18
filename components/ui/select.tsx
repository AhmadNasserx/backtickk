import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { CONTROL_BASE } from "@/components/ui/input";
import { ChevronDownIcon } from "@/components/ui/icons";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

// Native <select> so it works without JavaScript and keeps platform keyboard/mobile pickers.
export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative w-full">
      <select
        className={cn(CONTROL_BASE, "h-10 appearance-none px-3 pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-subtle"
      />
    </div>
  );
}
