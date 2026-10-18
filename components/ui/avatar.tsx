import Image from "next/image";
import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

const PIXELS: Record<AvatarSize, number> = { sm: 24, md: 32, lg: 40, xl: 64 };

const TEXT: Record<AvatarSize, string> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-xl",
};

export type AvatarProps = {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
};

export function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  return initials || "?";
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const px = PIXELS[size];

  if (src) {
    // Remote avatars come from OAuth providers; unoptimized avoids needing a remotePatterns entry per host.
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        unoptimized
        className={cn("shrink-0 rounded-full border border-line object-cover", className)}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-brand/20 font-semibold text-fg select-none",
        TEXT[size],
        className,
      )}
      style={{ width: px, height: px }}
    >
      {getInitials(name)}
    </span>
  );
}
