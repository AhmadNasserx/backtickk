// Dynamic: depends on the signed-in user. Their private record, including email, is never cached.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/forms/profile-form";
import { SignOutButton } from "@/components/forms/signin-buttons";
import { Card, CardContent } from "@/components/ui/card";
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

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "account", label: "Account" },
  { id: "session", label: "Session" },
] as const;

export default async function SettingsPage() {
  const user = await requireUserOrRedirect("/settings");
  const profile = await getUserDTOById(user.id);
  if (!profile) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="eyebrow">Preferences</p>
        <h1 className="font-display text-4xl leading-tight text-fg sm:text-5xl">Settings</h1>
        <p className="text-muted">Update how your profile appears to other members.</p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Settings sections" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <ul className="flex gap-1 rounded-xl border border-line bg-surface p-1 lg:flex-col lg:border-0 lg:bg-transparent lg:p-0">
            {SECTIONS.map((section) => (
              <li key={section.id} className="flex-1 lg:flex-none">
                <a
                  href={`#${section.id}`}
                  className="flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none lg:justify-start"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-12">
          <section id="profile" aria-labelledby="settings-profile-heading" className="flex scroll-mt-24 flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="settings-profile-heading" className="font-display text-2xl text-fg">
                Profile
              </h2>
              <p className="text-sm text-muted">Shown on your public profile and next to your posts.</p>
            </div>
            <Card>
              <CardContent className="p-5 sm:p-6">
                <ProfileForm
                  initial={{
                    name: profile.name,
                    username: profile.username,
                    bio: profile.bio,
                    skills: profile.skills,
                    image: profile.image,
                  }}
                />
              </CardContent>
            </Card>
          </section>

          <section id="account" aria-labelledby="settings-account-heading" className="flex scroll-mt-24 flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="settings-account-heading" className="font-display text-2xl text-fg">
                Account
              </h2>
              <p className="text-sm text-muted">How you signed in and where account emails go.</p>
            </div>
            <Card>
              <CardContent className="p-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
                  <dt className="text-muted">Signed in with</dt>
                  <dd className="text-fg">{PROVIDER_LABELS[profile.provider]}</dd>
                  <dt className="text-muted">Email</dt>
                  <dd className={profile.email ? "font-mono break-all text-fg" : "text-subtle"}>
                    {profile.email ?? "Not shared by your provider"}
                  </dd>
                </dl>
              </CardContent>
            </Card>
          </section>

          <section id="session" aria-labelledby="settings-session-heading" className="flex scroll-mt-24 flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="settings-session-heading" className="font-display text-2xl text-fg">
                Session
              </h2>
              <p className="text-sm text-muted">Control the sign-in on this device.</p>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-danger/30 bg-danger/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex flex-col gap-1">
                <p className="eyebrow text-danger">Danger zone</p>
                <p className="text-sm text-muted">Signing out ends your session on this device.</p>
              </div>
              <SignOutButton />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
