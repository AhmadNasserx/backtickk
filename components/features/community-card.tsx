// Server component: the card is static markup; only the join button is a client island.
import Link from "next/link";
import { JoinCommunityButton } from "@/components/features/join-community-button";
import { TechLogo, communityLogoSlug } from "@/components/ui/tech-logo";
import { cn } from "@/lib/utils";
import type { CommunityDTO } from "@/types";

const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** The community colour when it is a valid CSS hex value, otherwise undefined. Safe to interpolate into a style. */
export function communityTint(color: string | null | undefined): string | undefined {
  return color && HEX_COLOR.test(color) ? color : undefined;
}

export type CommunityIconProps = {
  community: Pick<CommunityDTO, "name" | "icon" | "color">;
  /** The community slug, used to find a logo when the stored icon is not a logo slug. */
  slug?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

// Text sizes apply to the initial shown when no logo matches; logo sizes apply to the brand mark.
const ICON_SIZES = {
  sm: "size-9 text-sm",
  md: "size-11 text-lg",
  lg: "size-16 text-3xl",
  xl: "size-20 text-3xl sm:size-24 sm:text-4xl",
} as const;

const LOGO_SIZES = {
  sm: "size-5",
  md: "size-6",
  lg: "size-8",
  xl: "size-10 sm:size-12",
} as const;

/**
 * The community's brand logo centred in its tinted tile, or the first letter of its name when no logo matches.
 * Stored icon text is never rendered as-is.
 */
export function CommunityIcon({ community, slug, size = "md", className }: CommunityIconProps) {
  const tint = communityTint(community.color);
  const logo = communityLogoSlug({ icon: community.icon, slug, name: community.name });

  return (
    <span
      aria-hidden="true"
      style={
        tint
          ? {
              backgroundColor: `color-mix(in srgb, ${tint} 20%, transparent)`,
              borderColor: `color-mix(in srgb, ${tint} 45%, transparent)`,
            }
          : undefined
      }
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border font-mono font-semibold",
        tint ? "text-fg" : "border-line bg-accent-soft text-accent",
        ICON_SIZES[size],
        className,
      )}
    >
      {logo ? <TechLogo slug={logo} className={LOGO_SIZES[size]} /> : community.name.charAt(0).toUpperCase()}
    </span>
  );
}

export type CommunityCardProps = {
  community: CommunityDTO;
  /** Heading level of the name; pages set it so the outline stays in order. */
  headingLevel?: "h2" | "h3";
  /**
   * default: listing grids. featured: the large bento tile on the home page. compact: a short row for secondary tiles.
   */
  variant?: "default" | "featured" | "compact";
  className?: string;
};

function TopicList({ topics, limit }: { topics: string[]; limit: number }) {
  if (topics.length === 0) return null;
  return (
    <ul aria-label="Topics" className="flex flex-wrap gap-2">
      {topics.slice(0, limit).map((topic) => (
        <li key={topic}>
          <span className="tag">#{topic}</span>
        </li>
      ))}
    </ul>
  );
}

export function CommunityCard({ community, headingLevel = "h2", variant = "default", className }: CommunityCardProps) {
  const Heading = headingLevel;
  const tint = communityTint(community.color);

  if (variant === "featured") {
    return (
      <article
        className={cn(
          "card-hover relative isolate flex h-full min-h-72 min-w-0 flex-col gap-6 overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] sm:p-8",
          className,
        )}
      >
        {/* Decorative tint behind the content; no text, so it is hidden from assistive technology. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 -z-10 size-72 rounded-full opacity-40 blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${tint ?? "var(--color-accent)"}, transparent)` }}
        />
        <div className="flex items-start justify-between gap-4">
          <CommunityIcon community={community} slug={community.slug} size="lg" />
          <span className="eyebrow">Featured</span>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <Heading className="font-display text-3xl leading-tight text-fg sm:text-4xl">
            <Link href={`/communities/${community.slug}`} className="transition-colors hover:text-accent">
              {community.name}
            </Link>
          </Heading>
          <p className="line-clamp-4 max-w-prose text-base leading-7 text-muted">{community.description}</p>
        </div>
        <TopicList topics={community.topics} limit={8} />
        <JoinCommunityButton communityId={community.id} initialMemberCount={community.memberCount} className="mt-auto" />
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article
        className={cn(
          "card-hover flex h-full min-w-0 flex-col gap-4 rounded-xl border border-line bg-surface p-4 sm:p-5",
          className,
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <CommunityIcon community={community} slug={community.slug} size="sm" />
          <div className="flex min-w-0 flex-col">
            <Heading className="truncate text-base font-semibold tracking-tight text-fg">
              <Link href={`/communities/${community.slug}`} className="transition-colors hover:text-accent">
                {community.name}
              </Link>
            </Heading>
            <p className="truncate text-sm text-muted">{community.description}</p>
          </div>
        </div>
        <JoinCommunityButton communityId={community.id} initialMemberCount={community.memberCount} className="mt-auto" />
      </article>
    );
  }

  return (
    <article
      className={cn(
        "card-hover flex h-full min-w-0 flex-col gap-5 rounded-2xl border border-line bg-surface p-5 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] sm:p-6",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <CommunityIcon community={community} slug={community.slug} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <Heading className="text-lg font-semibold tracking-tight text-fg">
            <Link href={`/communities/${community.slug}`} className="transition-colors hover:text-accent">
              {community.name}
            </Link>
          </Heading>
          <p className="line-clamp-2 min-h-12 text-sm leading-6 text-muted">{community.description}</p>
        </div>
      </div>

      <TopicList topics={community.topics} limit={3} />

      <JoinCommunityButton communityId={community.id} initialMemberCount={community.memberCount} className="mt-auto" />
    </article>
  );
}
