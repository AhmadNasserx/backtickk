/*
 * Helpers shared by the client islands. The REST API answers errors as
 * `{ error: { message, details? } }`; zod validation puts field messages in `details.fieldErrors`.
 */

export const NETWORK_ERROR = "Network error. Check your connection and try again.";

export interface ApiFailure {
  message: string;
  fieldErrors: Record<string, string[]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function readApiFailure(response: Response, fallback: string): Promise<ApiFailure> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON bodies (for example a proxy error page) keep the fallback message.
  }

  const error = isRecord(body) && isRecord(body.error) ? body.error : null;
  const message = error && typeof error.message === "string" ? error.message : fallback;

  const details = error && isRecord(error.details) ? error.details : null;
  const rawFieldErrors = details && isRecord(details.fieldErrors) ? details.fieldErrors : null;
  const fieldErrors: Record<string, string[]> = {};
  if (rawFieldErrors) {
    for (const [field, messages] of Object.entries(rawFieldErrors)) {
      if (Array.isArray(messages)) {
        fieldErrors[field] = messages.filter((item): item is string => typeof item === "string");
      }
    }
  }

  return { message, fieldErrors };
}

/** Sign-in URL that returns the visitor to the page they are on. Call it from event handlers only. */
export function signInHref(): string {
  const current = `${window.location.pathname}${window.location.search}`;
  return `/signin?callbackUrl=${encodeURIComponent(current)}`;
}
