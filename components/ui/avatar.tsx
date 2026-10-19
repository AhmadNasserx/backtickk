import Image from "next/image";
import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

const PIXELS: Record<AvatarSize, number> = { sm: 24, md: 32, lg: 40, xl: 64 };

const TEXT: Record<AvatarSize, string> = {
  sm: "text-[11px]",
  md: "text-[13px]",
  lg: "text-base",
  xl: "text-2xl",
};

export type AvatarProps = {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
};

// Hosts listed in next.config.ts remotePatterns; these get the optimizer.
const OPTIMIZED_HOSTS = new Set(["avatars.githubusercontent.com", "lh3.googleusercontent.com"]);

function canOptimize(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && OPTIMIZED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

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

// Hue pairs chosen to stay out of the purple range; the palette leans warm and cool around the lime accent.
const GRADIENT_HUES: [number, number][] = [
  [22, 350],
  [48, 22],
  [92, 150],
  [150, 196],
  [176, 214],
  [196, 150],
  [214, 176],
  [350, 22],
];

function hashName(name: string): number {
  // FNV-1a: stable across server and client, so SSR and hydration agree.
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic CSS gradient for a name (avatar fallback, profile banners). */
export function getAvatarGradient(name: string): string {
  const [from, to] = GRADIENT_HUES[hashName(name.trim().toLowerCase()) % GRADIENT_HUES.length];
  return `linear-gradient(135deg, hsl(${from} 62% 46%) 0%, hsl(${to} 55% 22%) 100%)`;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const px = PIXELS[size];

  if (src) {
    // Unlisted hosts skip the optimizer, which would otherwise reject them.
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        unoptimized={!canOptimize(src)}
        className={cn("shrink-0 rounded-full border border-line object-cover ring-1 ring-inset ring-white/10", className)}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-line font-display leading-none text-fg select-none ring-1 ring-inset ring-white/10",
        TEXT[size],
        className,
      )}
      style={{ width: px, height: px, backgroundImage: getAvatarGradient(name) }}
    >
      {getInitials(name)}
    </span>
  );
}
