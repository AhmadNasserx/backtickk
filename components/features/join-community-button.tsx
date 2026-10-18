"use client";
// Client island: membership belongs to the viewer and toggles optimistically, so it cannot be rendered on the server.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  NETWORK_ERROR,
  getMyCommunityIds,
  readApiFailure,
  setMyCommunityMembership,
  signInHref,
} from "@/components/features/client-api";
import { Button } from "@/components/ui/button";
import { CheckIcon, PlusIcon } from "@/components/ui/icons";
import { FormError } from "@/components/ui/form-error";
import { Spinner } from "@/components/ui/spinner";
import { cn, formatCount } from "@/lib/utils";
import type { MembershipDTO } from "@/types";

export type JoinCommunityButtonProps = {
  communityId: string;
  /** Shown from the first render; join and leave answers keep it current. Without it the count stays hidden. */
  initialMemberCount?: number;
  className?: string;
};

interface MembershipState {
  member: boolean;
  memberCount: number | undefined;
}

function adjustCount(count: number | undefined, delta: number): number | undefined {
  return count === undefined ? undefined : Math.max(0, count + delta);
}

export function JoinCommunityButton({ communityId, initialMemberCount, className }: JoinCommunityButtonProps) {
  const router = useRouter();
  const { status } = useSession();
  const [membership, setMembership] = useState<MembershipState>({
    member: false,
    memberCount: initialMemberCount,
  });
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signedIn = status === "authenticated";
  // Signed-out visitors have a known state (not a member); only signed-in ones wait for the shared membership list.
  const ready = status === "unauthenticated" || (signedIn && loaded);
  const isMember = signedIn && membership.member;
  const memberCount = membership.memberCount;

  useEffect(() => {
    if (status !== "authenticated") return;

    // Every button on the page awaits the same memoised request, so the list costs one round trip.
    let active = true;
    getMyCommunityIds()
      .then((ids) => {
        if (active) setMembership((current) => ({ ...current, member: ids.has(communityId) }));
      })
      .catch(() => {
        if (active) setError("Could not load your membership. Refresh to try again.");
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [status, communityId]);

  async function toggle() {
    if (!ready || pending) return;
    if (!signedIn) {
      router.push(signInHref());
      return;
    }

    const previous = membership;
    const next = !previous.member;
    setMembership({ member: next, memberCount: adjustCount(previous.memberCount, next ? 1 : -1) });
    setPending(true);
    setError(null);

    let failure: string | null = null;
    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: next ? "POST" : "DELETE",
      });
      if (response.ok) {
        const data = (await response.json()) as MembershipDTO;
        setMembership({ member: data.member, memberCount: data.memberCount });
        setMyCommunityMembership(communityId, data.member);
        router.refresh();
      } else {
        failure = (await readApiFailure(response, "Could not update membership.")).message;
      }
    } catch {
      failure = NETWORK_ERROR;
    }

    if (failure) {
      setMembership(previous);
      setError(failure);
    }
    setPending(false);
  }

  const countLabel =
    memberCount === undefined ? null : `${formatCount(memberCount)} ${memberCount === 1 ? "member" : "members"}`;
  const busy = !ready || pending;
  const label = isMember ? "Joined" : "Join";

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {countLabel ? <span className="font-mono text-xs tracking-wide text-muted">{countLabel}</span> : null}
        <Button
          variant={isMember ? "secondary" : "primary"}
          size="sm"
          aria-pressed={isMember}
          disabled={busy}
          onClick={toggle}
          className={cn(
            "group min-w-24",
            isMember && "border-accent/40 bg-transparent text-accent hover:border-danger/60 hover:text-danger",
          )}
        >
          {busy ? (
            <Spinner size="sm" label={ready ? "Updating membership" : "Loading membership"} />
          ) : isMember ? (
            // Visual only: the accessible name below stays "Joined" while the hover label reads "Leave".
            <>
              <span aria-hidden="true" className="inline-flex items-center gap-1.5 group-hover:hidden">
                <CheckIcon className="size-4" />
                Joined
              </span>
              <span aria-hidden="true" className="hidden group-hover:inline">
                Leave
              </span>
            </>
          ) : (
            <>
              <PlusIcon aria-hidden="true" className="size-4" />
              <span aria-hidden="true">Join</span>
            </>
          )}
          <span className="sr-only">{label}</span>
        </Button>
      </div>
      <FormError message={error} />
    </div>
  );
}
