import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

// Rendered by forbidden() (HTTP 403). Mirrors not-found.tsx so the two error pages read as one family.
export default function Forbidden() {
  return (
    <div className="relative isolate mx-auto flex min-h-[60dvh] w-full max-w-2xl flex-col justify-center gap-6 py-12">
      <div
        aria-hidden="true"
        className="bg-glow pointer-events-none absolute -top-24 -left-24 -z-10 size-96"
      />

      <p className="font-mono text-[clamp(5.5rem,20vw,10rem)] leading-none font-medium tracking-tighter text-accent">
        403
      </p>

      <h1 className="font-display text-4xl leading-tight tracking-tight text-balance text-fg sm:text-5xl">
        You can&rsquo;t do that
      </h1>

      <p className="max-w-prose text-base leading-relaxed text-muted">
        Your account doesn&rsquo;t have permission for this page. Only the author and site admins can
        change a post. If you think this is a mistake, check that you are signed in with the right account.
      </p>

      <div
        aria-hidden="true"
        className="max-w-md overflow-x-auto rounded-xl border border-line bg-surface p-4 font-mono text-sm leading-relaxed text-muted"
      >
        <p>
          <span className="text-accent">$</span> edit --as current-user
        </p>
        <p className="text-subtle">permission denied: role does not allow this action</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/" className={buttonClasses("primary", "md")}>
          Back to home
        </Link>
        <Link href="/dashboard" className={buttonClasses("secondary", "md")}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
