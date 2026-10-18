// Server component: chips are plain links, so filtering works without JavaScript.
// On phones they scroll horizontally in one snapping row; from sm up they wrap.
import Link from "next/link";
import { cn, withParams } from "@/lib/utils";

export type TopicChipsProps = {
  topics: readonly string[];
  /** Path the chips link to. */
  basePath?: string;
  /** Current params to keep; the `topic` param is added, or removed for the active chip. */
  searchParams?: Record<string, string | undefined>;
  activeTopic?: string;
  label?: string;
  /** Adds a first chip that clears the topic filter, e.g. "All". */
  allLabel?: string;
  className?: string;
};

const CHIP_BASE =
  "inline-flex h-10 shrink-0 snap-start items-center rounded-full border px-3.5 font-mono text-sm whitespace-nowrap transition-colors sm:h-9";

export function TopicChips({
  topics,
  basePath = "/blogs",
  searchParams = {},
  activeTopic,
  label = "Topics",
  allLabel,
  className,
}: TopicChipsProps) {
  if (topics.length === 0) return null;

  const hrefFor = (topic: string | null) =>
    `${basePath}${withParams(searchParams, { topic: topic ?? undefined, page: null })}`;

  return (
    <nav
      aria-label={label}
      className={cn(
        "-mx-4 flex min-w-0 max-w-[calc(100%+2rem)] snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:max-w-none sm:snap-none sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {allLabel ? (
        <Link
          href={hrefFor(null)}
          aria-current={activeTopic ? undefined : "true"}
          className={cn(
            CHIP_BASE,
            activeTopic
              ? "border-line bg-surface text-muted hover:border-line-strong hover:text-fg"
              : "border-accent/60 bg-accent-soft text-fg",
          )}
        >
          {allLabel}
        </Link>
      ) : null}
      {topics.map((topic) => {
        const active = topic === activeTopic;
        return (
          <Link
            key={topic}
            href={hrefFor(active ? null : topic)}
            aria-current={active ? "true" : undefined}
            className={cn(
              CHIP_BASE,
              active
                ? "border-accent/60 bg-accent-soft text-fg"
                : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
            )}
          >
            {topic}
          </Link>
        );
      })}
    </nav>
  );
}
