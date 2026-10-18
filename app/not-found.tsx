import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <div className="relative isolate mx-auto flex min-h-[60dvh] w-full max-w-2xl flex-col justify-center gap-6 py-12">
      <div
        aria-hidden="true"
        className="bg-glow pointer-events-none absolute -top-24 -left-24 -z-10 size-96"
      />

      <p className="font-mono text-[clamp(5.5rem,20vw,10rem)] leading-none font-medium tracking-tighter text-accent">
        404
      </p>

      <h1 className="font-display text-4xl leading-tight tracking-tight text-balance text-fg sm:text-5xl">
        This page isn&rsquo;t in the repo.
      </h1>

      <p className="max-w-prose text-base leading-relaxed text-muted">
        The link may be outdated, or the page was moved or removed. Start from the home page or
        browse the communities.
      </p>

      <div
        aria-hidden="true"
        className="max-w-md overflow-x-auto rounded-xl border border-line bg-surface p-4 font-mono text-sm leading-relaxed text-muted"
      >
        <p>
          <span className="text-accent">$</span> open /this-page
        </p>
        <p className="text-subtle">bash: /this-page: No such file or directory</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/" className={buttonClasses("primary", "md")}>
          Back to home
        </Link>
        <Link href="/communities" className={buttonClasses("secondary", "md", "gap-1.5")}>
          Browse communities
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </div>
  );
}
