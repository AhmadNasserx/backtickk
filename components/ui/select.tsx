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
        className={cn(
          CONTROL_BASE,
          "h-10 cursor-pointer appearance-none px-3 pr-10 text-base max-sm:h-11 sm:text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-subtle" />
    </div>
  );
}
