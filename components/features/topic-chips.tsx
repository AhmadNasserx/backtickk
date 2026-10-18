// Server component: chips are plain links, so filtering works without JavaScript.
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
  className?: string;
};

export function TopicChips({
  topics,
  basePath = "/blogs",
  searchParams = {},
  activeTopic,
  label = "Topics",
  className,
}: TopicChipsProps) {
  if (topics.length === 0) return null;

  return (
    <nav aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {topics.map((topic) => {
        const active = topic === activeTopic;
        return (
          <Link
            key={topic}
            href={`${basePath}${withParams(searchParams, { topic: active ? null : topic, page: null })}`}
            aria-current={active ? "true" : undefined}
            className={cn(
              "inline-flex h-8 items-center rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              active
                ? "border-brand bg-brand/15 text-fg"
                : "border-line bg-surface text-muted hover:border-subtle hover:text-fg",
            )}
          >
            {topic}
          </Link>
        );
      })}
    </nav>
  );
}
