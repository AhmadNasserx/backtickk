// Dynamic: depends on the request. It reads callbackUrl and error, and checks for an existing session.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { SignInButtons } from "@/components/forms/signin-buttons";
import { getCurrentUser } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Sign in",
};

const DEFAULT_CALLBACK_URL = "/dashboard";

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
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-sm flex-col justify-center py-10">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold tracking-tight">Sign in to DevCommunity</h1>
          <p className="text-sm text-muted">
            Use the GitHub or Google account you already have. No password is needed.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FormError message={errorMessage} />
          <SignInButtons callbackUrl={callbackUrl} />
          <p className="text-xs text-subtle">
            We use your provider profile (name, avatar and email) to create your account. Read the{" "}
            <Link href="/about" className="underline underline-offset-2 hover:text-fg">
              community guidelines
            </Link>{" "}
            before posting.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
