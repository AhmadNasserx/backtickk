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

// Module-level cache: one `/api/me/communities` request serves every join button on the page. Sign-in and sign-out
// are full navigations, so the cache never outlives the viewer it was loaded for.
let myCommunityIds: Promise<Set<string>> | null = null;

/**
 * Ids of the communities the signed-in viewer has joined. A 401 means nobody is signed in, so the set is empty.
 * A failed request is not cached, so the next caller retries.
 */
export function getMyCommunityIds(): Promise<Set<string>> {
  if (!myCommunityIds) {
    const request: Promise<Set<string>> = fetch("/api/me/communities").then(async (response) => {
      if (response.status === 401) return new Set<string>();
      if (!response.ok) throw new Error("Could not load memberships");
      const body: unknown = await response.json();
      const ids = isRecord(body) && Array.isArray(body.ids) ? body.ids : [];
      return new Set(ids.filter((id): id is string => typeof id === "string"));
    });
    myCommunityIds = request;
    // Drop a failed request so the next button mount retries; the rejection still reaches this caller.
    request.catch(() => {
      if (myCommunityIds === request) myCommunityIds = null;
    });
  }
  return myCommunityIds;
}

/** Records a join or leave once the server has answered, so buttons mounted later read the new state. */
export function setMyCommunityMembership(communityId: string, member: boolean): void {
  if (!myCommunityIds) return;
  myCommunityIds
    .then((ids) => {
      if (member) ids.add(communityId);
      else ids.delete(communityId);
    })
    .catch(() => {
      // A failed load is retried by the next caller, so there is nothing to update.
    });
}
