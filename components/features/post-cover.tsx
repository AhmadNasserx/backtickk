// Server component: most posts have no cover image, so the cover is drawn with CSS and makes no image request.
import Image from "next/image";
import type { CSSProperties } from "react";
import { TechLogo, communityLogoSlug } from "@/components/ui/tech-logo";
import { cn } from "@/lib/utils";

const HEX_COLOR = /^#[0-9a-f]{3,8}$/i;
const FALLBACK_TINT = "var(--color-accent)";

export type PostCoverProps = {
  title: string;
  community: { name: string; slug?: string | null; icon?: string | null; color?: string | null };
  coverImage?: string | null;
  className?: string;
  /** Loads the image eagerly. Only for an above-the-fold cover. */
  priority?: boolean;
};

/**
 * Fixed 16:9 frame. Without an image it is a gradient and dot grid tinted by the community colour, with the
 * community logo (or initial) large and faint. Layout (border, radius, aspect) comes from className, so callers can reshape it.
 */
export function PostCover({ title, community, coverImage, className, priority = false }: PostCoverProps) {
  if (coverImage) {
    return (
      <div className={cn("relative aspect-video overflow-hidden bg-surface-2", className)}>
        {/* Remote covers are served as-is, as with avatars: there is no image host allow-list to configure. */}
        <Image
          src={coverImage}
          alt={`Cover image for ${title}`}
          fill
          sizes="(min-width: 1024px) 40rem, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          unoptimized
          className="object-cover"
        />
      </div>
    );
  }

  const tint = community.color && HEX_COLOR.test(community.color) ? community.color : FALLBACK_TINT;
  const logo = communityLogoSlug(community);
  const style = {
    "--cover": tint,
    backgroundImage: [
      "radial-gradient(90% 80% at 0% 0%, color-mix(in srgb, var(--cover) 40%, transparent), transparent 62%)",
      "radial-gradient(color-mix(in srgb, var(--cover) 34%, transparent) 1px, transparent 1.25px)",
      "linear-gradient(160deg, color-mix(in srgb, var(--cover) 16%, var(--color-surface-2)), var(--color-surface) 80%)",
    ].join(", "),
    backgroundSize: "100% 100%, 16px 16px, 100% 100%",
  } as CSSProperties;

  return (
    <div aria-hidden="true" style={style} className={cn("relative aspect-video overflow-hidden bg-surface-2", className)}>
      {logo ? (
        <span
          style={{ color: tint }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 select-none"
        >
          <TechLogo slug={logo} mono className="h-2/5 w-auto aspect-square" />
        </span>
      ) : (
        <span
          style={{ color: tint }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[5.5rem] leading-none opacity-25 blur-[1.5px] select-none"
        >
          {community.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
