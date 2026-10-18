// Server component: member rows are static links to public profiles, so no client code is needed.
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import type { MemberDTO } from "@/types";

export type MemberListProps = {
  /** The first page of members, newest first. */
  members: MemberDTO[];
  /** Total members in the community, not just the ones passed in. */
  total: number;
  communityName: string;
};

const STACK_SIZE = 5;

function AvatarStack({ members }: { members: MemberDTO[] }) {
  if (members.length === 0) return null;
  return (
    <div aria-hidden="true" className="flex -space-x-2">
      {members.map((member) => (
        <span key={member.id} className="inline-flex rounded-full ring-2 ring-surface">
          <Avatar name={member.name} src={member.image} size="sm" />
        </span>
      ))}
    </div>
  );
}

function MemberRow({ member }: { member: MemberDTO }) {
  return (
    <Link
      href={`/profile/${encodeURIComponent(member.username)}`}
      className="card-hover group flex min-w-0 items-center gap-3 rounded-xl border border-line bg-surface p-3 outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span aria-hidden="true" className="inline-flex shrink-0">
        <Avatar name={member.name} src={member.image} size="md" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-fg transition-colors group-hover:text-accent">{member.name}</span>
        <span className="truncate font-mono text-xs text-muted">@{member.username}</span>
      </span>
    </Link>
  );
}

export function MemberList({ members, total, communityName }: MemberListProps) {
  const hidden = Math.max(0, total - members.length);

  return (
    <section aria-labelledby="community-members" className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <h2 id="community-members" className="font-display text-3xl tracking-tight text-fg">
          Members
        </h2>
        {total > 0 ? (
          <div className="flex items-center gap-3">
            <AvatarStack members={members.slice(0, STACK_SIZE)} />
            <p className="font-mono text-sm text-muted">
              {total} {total === 1 ? "member" : "members"}
            </p>
          </div>
        ) : null}
      </div>

      {total === 0 ? (
        <EmptyState
          title="Be the first to join"
          description={`Nobody has joined ${communityName} yet. Your join puts you at the top of this list.`}
        />
      ) : (
        <div className="flex min-w-0 flex-col gap-4">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <li key={member.id} className="min-w-0">
                <MemberRow member={member} />
              </li>
            ))}
          </ul>
          {hidden > 0 ? <p className="font-mono text-xs text-subtle">+{hidden} more</p> : null}
        </div>
      )}
    </section>
  );
}
