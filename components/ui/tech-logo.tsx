// Server-safe: plain SVG markup, no client state. Brand marks come from data/tech-logos.ts.
import { TECH_LOGOS, hasTechLogo, resolveTechSlug } from "@/data/tech-logos";
import { cn } from "@/lib/utils";

// Brand colours below this relative luminance vanish on the near-black UI and render in the UI foreground instead.
// 0.15 sits in the gap between the darkest brands (Flutter 0.09) and the bluest ones (Dart 0.17); a higher cut
// would also turn TypeScript, PHP and PostgreSQL cream.
const DARK_LUMINANCE_LIMIT = 0.15;
const UI_FOREGROUND = "#f3f2ee";

function relativeLuminance(hex: string): number {
  const digits = hex.replace("#", "");
  const [red, green, blue] = [0, 2, 4].map((offset) => {
    const channel = parseInt(digits.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function brandFill(hex: string): string {
  return relativeLuminance(hex) < DARK_LUMINANCE_LIMIT ? UI_FOREGROUND : hex;
}

export type TechLogoProps = {
  /** A TECH_LOGOS key (simple-icons slug). Renders nothing for an unknown slug. */
  slug: string;
  /** Sizing and placement. Defaults to size-6 when omitted; a provided className replaces that default. */
  className?: string;
  /** Accessible name. Defaults to the brand title. Callers that print the name next to the mark hide it with aria-hidden on a wrapper. */
  title?: string;
  /** Paints the mark in currentColor so it takes the surrounding text colour. */
  mono?: boolean;
};

export function TechLogo({ slug, className, title, mono = false }: TechLogoProps) {
  if (!hasTechLogo(slug)) return null;
  const logo = TECH_LOGOS[slug];

  return (
    <svg
      role="img"
      aria-label={title ?? logo.title}
      viewBox="0 0 24 24"
      fill={mono ? "currentColor" : brandFill(logo.hex)}
      className={cn(className ?? "size-6", "shrink-0")}
    >
      <path d={logo.path} />
    </svg>
  );
}

/** The logo slug for a community: its stored icon first, then its slug, then its name. Null when none matches. */
export function communityLogoSlug(community: {
  icon?: string | null;
  slug?: string | null;
  name?: string | null;
}): string | null {
  return resolveTechSlug(community.icon) ?? resolveTechSlug(community.slug) ?? resolveTechSlug(community.name);
}
