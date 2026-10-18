// Server component: the card is static markup; only the join button is a client island.
import Link from "next/link";
import { JoinCommunityButton } from "@/components/features/join-community-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CommunityDTO } from "@/types";

const HEX_COLOR = /^#[0-9a-f]{3,8}$/i;

export type CommunityIconProps = {
  community: Pick<CommunityDTO, "name" | "icon" | "color">;
  size?: "md" | "lg";
  className?: string;
};

/** Emoji or short text when the community has one, otherwise its initial, tinted with the community colour when it is a hex value. */
export function CommunityIcon({ community, size = "md", className }: CommunityIconProps) {
  const label = community.icon || community.name.charAt(0).toUpperCase();
  const tint = community.color && HEX_COLOR.test(community.color) ? community.color : undefined;

  return (
    <span
      aria-hidden="true"
      style={tint ? { backgroundColor: `color-mix(in srgb, ${tint} 22%, transparent)` } : undefined}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border border-line bg-brand/15 font-semibold text-fg",
        size === "lg" ? "size-16 text-2xl" : "size-11 text-lg",
        className,
      )}
    >
      {label}
    </span>
  );
}

export type CommunityCardProps = {
  community: CommunityDTO;
  /** Heading level of the name; pages set it so the outline stays in order. */
  headingLevel?: "h2" | "h3";
  className?: string;
};

export function CommunityCard({ community, headingLevel = "h2", className }: CommunityCardProps) {
  const Heading = headingLevel;
  return (
    <article
      className={cn(
        "flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-subtle sm:p-6",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <CommunityIcon community={community} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <Heading className="text-base font-semibold tracking-tight text-fg">
            <Link href={`/communities/${community.slug}`} className="transition-colors hover:text-brand">
              {community.name}
            </Link>
          </Heading>
          <p className="line-clamp-2 text-sm leading-6 text-muted">{community.description}</p>
        </div>
      </div>

      {community.topics.length > 0 ? (
        <ul aria-label="Topics" className="flex flex-wrap gap-2">
          {community.topics.slice(0, 5).map((topic) => (
            <li key={topic}>
              <Badge>{topic}</Badge>
            </li>
          ))}
        </ul>
      ) : null}

      <JoinCommunityButton communityId={community.id} initialMemberCount={community.memberCount} className="mt-auto" />
    </article>
  );
}
