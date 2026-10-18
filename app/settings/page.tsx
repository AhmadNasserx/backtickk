// Dynamic: depends on the signed-in user. Their private record, including email, is never cached.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/forms/profile-form";
import { SignOutButton } from "@/components/forms/signin-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUserOrRedirect } from "@/lib/auth-helpers";
import { getUserDTOById } from "@/lib/data/users";
import type { UserProvider } from "@/types";

export const metadata: Metadata = {
  title: "Settings",
};

const PROVIDER_LABELS: Record<UserProvider, string> = {
  github: "GitHub",
  google: "Google",
  seed: "Seed account",
};

export default async function SettingsPage() {
  const user = await requireUserOrRedirect("/settings");
  const profile = await getUserDTOById(user.id);
  if (!profile) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Update how your profile appears to other members.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <p className="text-sm text-muted">Shown on your public profile and next to your posts.</p>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initial={{
              name: profile.name,
              username: profile.username,
              bio: profile.bio,
              skills: profile.skills,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_1fr]">
            <dt className="text-muted">Signed in with</dt>
            <dd className="text-fg">{PROVIDER_LABELS[profile.provider]}</dd>
            <dt className="text-muted">Email</dt>
            <dd className="text-fg break-all">{profile.email ?? "Not shared by your provider"}</dd>
          </dl>
          <div className="border-t border-line pt-4">
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
