// Server component: a static checklist built from data the dashboard already loads. No client state or handlers.
import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";

export interface ProfileCompletionProps {
  bio: string;
  skills: string[];
  hasJoinedCommunity: boolean;
  hasPublishedPost: boolean;
}

interface Step {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
}

/** Renders nothing once every step is done, so the card only shows while there is something to finish. */
export function ProfileCompletion({ bio, skills, hasJoinedCommunity, hasPublishedPost }: ProfileCompletionProps) {
  const steps: Step[] = [
    { id: "bio", label: "Add a short bio", done: bio.trim().length > 0, href: "/settings#profile", cta: "Write bio" },
    { id: "skills", label: "List your skills", done: skills.length > 0, href: "/settings#profile", cta: "Add skills" },
    { id: "join", label: "Join a community", done: hasJoinedCommunity, href: "/communities", cta: "Browse" },
    { id: "publish", label: "Publish your first post", done: hasPublishedPost, href: "/create", cta: "Write" },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const total = steps.length;
  if (doneCount === total) return null;

  const percent = Math.round((doneCount / total) * 100);

  return (
    <section
      aria-labelledby="profile-completion-heading"
      className="relative isolate min-w-0 overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] sm:p-6"
    >
      <div aria-hidden="true" className="bg-glow pointer-events-none absolute -top-24 -right-24 -z-10 size-64" />

      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-3">
          <p className="eyebrow">Profile setup</p>
          <div className="flex flex-col gap-1">
            <h2 id="profile-completion-heading" className="font-display text-2xl leading-tight text-fg sm:text-3xl">
              Finish setting up your profile
            </h2>
            <p className="text-sm text-muted">A complete profile helps people decide whether to follow your posts.</p>
          </div>

          <div className="flex items-center gap-3">
            <div
              role="progressbar"
              aria-label="Profile setup progress"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={doneCount}
              aria-valuetext={`${doneCount} of ${total} steps done`}
              className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-3"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 origin-left rounded-full bg-accent transition-transform duration-500 ease-out motion-reduce:transition-none"
                style={{ transform: `scaleX(${percent / 100})` }}
              />
            </div>
            <span aria-hidden="true" className="shrink-0 font-mono text-xs tabular-nums text-subtle">
              {doneCount}/{total}
            </span>
          </div>
        </header>

        <ul className="flex flex-col divide-y divide-line">
          {steps.map((step) => (
            <li key={step.id} className="flex min-w-0 items-center gap-3 py-2.5">
              {step.done ? (
                <span
                  aria-hidden="true"
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg"
                >
                  <CheckIcon className="size-3.5" />
                </span>
              ) : (
                <span aria-hidden="true" className="size-6 shrink-0 rounded-full border-2 border-line-strong" />
              )}

              <span className="sr-only">{step.done ? "Done: " : "To do: "}</span>
              <span className={step.done ? "min-w-0 flex-1 text-sm text-muted line-through decoration-line-strong" : "min-w-0 flex-1 text-sm text-fg"}>
                {step.label}
              </span>

              {step.done ? null : (
                <Link
                  href={step.href}
                  className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-accent underline-offset-4 transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none sm:min-h-0 sm:py-1"
                >
                  {step.cta}
                  <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
