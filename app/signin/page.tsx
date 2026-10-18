// Dynamic: depends on the request. It reads callbackUrl and error, and checks for an existing session.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormError } from "@/components/ui/form-error";
import { Wordmark } from "@/components/ui/logo";
import { SignInButtons } from "@/components/forms/signin-buttons";
import { getCurrentUser } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Sign in",
};

const DEFAULT_CALLBACK_URL = "/dashboard";

const BENEFITS = [
  "Join communities around the tools you use every day.",
  "Publish technical posts written in Markdown.",
  "Bookmark posts and come back to them later.",
  "Build a profile that shows your skills and writing.",
];

// Auth.js error codes, as sent back in ?error=. Anything else gets the generic message.
const AUTH_ERROR_MESSAGES = new Map<string, string>([
  ["AccessDenied", "Access was denied. Your account may not be allowed to sign in."],
  [
    "OAuthAccountNotLinked",
    "This email is already linked to another sign-in method. Sign in with the provider you used first.",
  ],
  ["Configuration", "Sign-in is not configured correctly. Please try again later."],
]);
const DEFAULT_AUTH_ERROR = "Sign-in failed. Please try again.";

type SignInSearchParams = Promise<{
  callbackUrl?: string | string[];
  error?: string | string[];
}>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Accepts only same-site paths such as "/blogs/x". Protocol-relative ("//host") and
 * backslash forms are browser-normalised to other origins, so they fall back to the dashboard.
 */
function safeCallbackUrl(value: string | undefined): string {
  if (!value || !/^\/(?![/\\])[\x21-\x7e]*$/.test(value)) {
    return DEFAULT_CALLBACK_URL;
  }
  return value;
}

function authErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES.get(code) ?? DEFAULT_AUTH_ERROR;
}

export default async function SignInPage({ searchParams }: { searchParams: SignInSearchParams }) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(first(params.callbackUrl));

  if (await getCurrentUser()) {
    redirect(callbackUrl);
  }

  const errorMessage = authErrorMessage(first(params.error));

  return (
    <div className="mx-auto w-full max-w-5xl py-2 sm:py-6">
      <div className="relative isolate overflow-hidden rounded-3xl border border-line bg-surface">
        <div
          aria-hidden="true"
          className="bg-dots pointer-events-none absolute inset-0 -z-10 opacity-60"
        />
        <div
          aria-hidden="true"
          className="bg-glow pointer-events-none absolute -top-40 -left-40 -z-10 size-[36rem]"
        />

        <div className="grid grid-cols-1 gap-10 p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14 lg:p-14">
          <div className="flex min-w-0 flex-col gap-8">
            <div className="flex flex-col gap-5">
              <Wordmark className="self-start" />
              <p className="eyebrow">Get started</p>
              <h1 className="font-display text-5xl leading-[1.02] tracking-tight text-balance text-fg sm:text-6xl">
                Where developers <em className="italic text-accent">write</em> in the open.
              </h1>
              <p className="max-w-md text-base leading-relaxed text-muted">
                Communities, technical blogs and honest discussion about the tools you use every day.
              </p>
            </div>

            <ul className="flex flex-col gap-3 text-sm leading-relaxed text-muted">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 rounded-2xl border border-line bg-bg/80 p-6 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] backdrop-blur sm:p-8">
            <h2 className="font-display text-3xl tracking-tight text-fg">Sign in to Backtick</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Use the GitHub or Google account you already have. No password is needed.
            </p>

            <div className="mt-6 flex flex-col gap-4">
              <FormError message={errorMessage} />
              <SignInButtons callbackUrl={callbackUrl} />
            </div>

            <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-subtle">
              We use your provider profile (name, avatar and email) to create your account. Read the{" "}
              <Link
                href="/about"
                className="rounded text-muted underline underline-offset-2 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                community guidelines
              </Link>{" "}
              before posting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
