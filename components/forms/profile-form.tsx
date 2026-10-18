"use client";
// Client boundary: live bio counter, skill chips and the PATCH submission need browser state and event handlers.

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { FormError } from "@/components/ui/form-error";
import { updateProfileSchema } from "@/schemas/profile";
import { TagInput } from "@/components/forms/tag-input";
import { focusFirstInvalid, readFormFailure, zodFieldErrors, type FieldErrors } from "@/components/forms/form-errors";
import { NETWORK_ERROR } from "@/components/features/client-api";

export interface ProfileFormInitial {
  name: string;
  username: string;
  bio: string;
  skills: string[];
}

const BIO_MAX = 280;
const SKILLS_MAX = 15;

export function ProfileForm({ initial }: { initial: ProfileFormInitial }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<ProfileFormInitial>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invalidAttempt, setInvalidAttempt] = useState(0);

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
    if (submitting) return;
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
      setSaved(true);
      router.refresh();
    } catch {
      setFormError(NETWORK_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <FormError message={formError} />

      <Field id="profile-name" label="Name" error={errors.name}>
        <Input
          value={values.name}
          onChange={(event) => setField("name", event.target.value)}
          autoComplete="name"
        />
      </Field>

      <Field
        id="profile-username"
        label="Username"
        hint="3-30 characters: lowercase letters, digits, - or _."
        error={errors.username}
      >
        <Input
          value={values.username}
          onChange={(event) => setField("username", event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
        />
      </Field>

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

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? <Spinner size="sm" label="Saving" /> : null}
          {submitting ? "Saving..." : "Save profile"}
        </Button>
        <p role="status" aria-live="polite" className="text-sm text-success">
          {saved ? "Profile saved." : ""}
        </p>
      </div>
    </form>
  );
}
