import { z } from "zod";
import { readApiFailure as readErrorBody } from "@/components/features/client-api";

/** Field name to first message. Keys are the Zod schema field names, shared by client and server errors. */
export type FieldErrors = Partial<Record<string, string>>;

export interface FormFailure {
  message: string;
  fieldErrors: FieldErrors;
}

const SESSION_EXPIRED = "Your session has expired. Sign in again to continue.";
const FIELDS_TO_FIX = "Please fix the highlighted fields.";
const GENERIC_FAILURE = "Something went wrong. Please try again.";

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: Record<string, string[] | undefined> = z.flattenError(error).fieldErrors;
  const out: FieldErrors = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) out[key] = messages[0];
  }
  return out;
}

/**
 * Turns a failed API response into a banner message plus field messages. When the server
 * names fields, the banner says to fix them instead of repeating the field text.
 */
export async function readFormFailure(response: Response): Promise<FormFailure> {
  if (response.status === 401) {
    return { message: SESSION_EXPIRED, fieldErrors: {} };
  }

  const failure = await readErrorBody(response, GENERIC_FAILURE);
  const fieldErrors: FieldErrors = {};
  for (const [key, messages] of Object.entries(failure.fieldErrors)) {
    if (messages[0]) fieldErrors[key] = messages[0];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { message: FIELDS_TO_FIX, fieldErrors };
  }
  return { message: failure.message, fieldErrors: {} };
}

/** Moves focus to the first control flagged with aria-invalid, so keyboard users land on the problem. */
export function focusFirstInvalid(root: HTMLElement | null): void {
  root?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}
