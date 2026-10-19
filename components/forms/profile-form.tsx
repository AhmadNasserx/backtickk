"use client";
// Client boundary: live bio counter, skill chips, dirty tracking and the PATCH submission need browser state and event handlers.

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { FormError } from "@/components/ui/form-error";
import { CheckIcon } from "@/components/ui/icons";
import { updateProfileSchema } from "@/schemas/profile";
import { TagInput } from "@/components/forms/tag-input";
import { focusFirstInvalid, readFormFailure, zodFieldErrors, type FieldErrors } from "@/components/forms/form-errors";
import { NETWORK_ERROR } from "@/components/features/client-api";

export interface ProfileFormInitial {
  name: string;
  username: string;
  bio: string;
  skills: string[];
  /** Shown in the avatar preview. Optional so callers without an image still compile. */
  image?: string | null;
}

const BIO_MAX = 280;
const SKILLS_MAX = 15;

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

type UsernameControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  value: string;
  onChange: (value: string) => void;
};

/** Username input with a fixed "@" prefix. Field passes the id and aria props down to this control. */
function UsernameControl({ id, value, onChange, "aria-describedby": describedBy, "aria-invalid": invalid }: UsernameControlProps) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono text-sm text-subtle"
      >
        @
      </span>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        className="pl-7 font-mono"
      />
    </div>
  );
}

export function ProfileForm({ initial }: { initial: ProfileFormInitial }) {
  const router = useRouter();
  const { update } = useSession();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<ProfileFormInitial>(initial);
  // The last saved (or loaded) values; the Save button stays disabled until the form differs from them.
  const [baseline, setBaseline] = useState<ProfileFormInitial>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invalidAttempt, setInvalidAttempt] = useState(0);

  const dirty =
    values.name !== baseline.name ||
    values.username !== baseline.username ||
    values.bio !== baseline.bio ||
    !sameList(values.skills, baseline.skills);

  // Runs after the render that shows the errors, so the target has aria-invalid when we look for it.
  useEffect(() => {
    if (invalidAttempt > 0) focusFirstInvalid(formRef.current);
  }, [invalidAttempt]);

  function setField<K extends keyof ProfileFormInitial>(key: K, value: ProfileFormInitial[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !dirty) return;
    setFormError(null);
    setSaved(false);

    const parsed = updateProfileSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      setInvalidAttempt((n) => n + 1);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const failure = await readFormFailure(response);
        setErrors(failure.fieldErrors);
        setFormError(failure.message);
        if (Object.keys(failure.fieldErrors).length > 0) setInvalidAttempt((n) => n + 1);
        return;
      }
      // Show the normalised values (trimmed, lowercase username) and treat them as the new baseline.
      const next: ProfileFormInitial = {
        name: parsed.data.name,
        username: parsed.data.username,
        bio: parsed.data.bio,
        skills: parsed.data.skills,
        image: values.image,
      };
      setValues(next);
      setBaseline(next);
      setSaved(true);
      // Refreshes the JWT (username, role) so the header menu's profile link is current.
      await update();
      router.refresh();
    } catch {
      setFormError(NETWORK_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  const previewName = values.name.trim() || initial.name;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <FormError message={formError} />

      <div aria-hidden="true" className="flex items-center gap-4">
        <Avatar name={previewName || "?"} src={values.image} size="xl" />
        <div className="min-w-0">
          <p className="truncate font-display text-2xl text-fg">{previewName || "Your name"}</p>
          <p className="truncate font-mono text-sm text-subtle">@{values.username || "username"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="profile-name" label="Name" error={errors.name} className="min-w-0">
          <Input
            value={values.name}
            onChange={(event) => setField("name", event.target.value)}
            autoComplete="name"
          />
        </Field>

        <Field
          id="profile-username"
          label="Username"
          className="min-w-0"
          hint="3-30 characters: lowercase letters, digits, - or _."
          error={errors.username}
        >
          <UsernameControl
            value={values.username}
            onChange={(username) => setField("username", username)}
          />
        </Field>
      </div>

      <Field
        id="profile-bio"
        label="Bio"
        hint={`${values.bio.length}/${BIO_MAX} characters`}
        error={errors.bio}
      >
        <Textarea
          value={values.bio}
          onChange={(event) => setField("bio", event.target.value)}
          rows={4}
        />
      </Field>

      <Field
        id="profile-skills"
        label="Skills"
        hint={`Up to ${SKILLS_MAX}. Press Enter or type a comma after each skill.`}
        error={errors.skills}
      >
        <TagInput
          id="profile-skills"
          value={values.skills}
          onChange={(skills) => setField("skills", skills)}
          max={SKILLS_MAX}
          placeholder="e.g. React, PostgreSQL"
        />
      </Field>

      <div className="flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        {/* The wrapper stays mounted so screen readers announce the banner when it appears. */}
        <div role="status" aria-live="polite" className="min-h-0">
          {saved ? (
            <p className="inline-flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              <CheckIcon className="size-4 shrink-0" />
              Profile saved.
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          disabled={!dirty || submitting}
          aria-busy={submitting}
          className="w-full sm:w-auto"
        >
          {submitting ? <Spinner size="sm" label="Saving" /> : null}
          {submitting ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
