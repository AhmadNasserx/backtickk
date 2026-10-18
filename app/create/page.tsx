// Dynamic: depends on the signed-in user. Their joined communities decide where a post can go.
import type { Metadata } from "next";
import Link from "next/link";
import { PostForm } from "@/components/forms/post-form";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { UsersIcon } from "@/components/ui/icons";
import { requireUserOrRedirect } from "@/lib/auth-helpers";
import { listUserCommunities } from "@/lib/data/communities";

export const metadata: Metadata = {
  title: "Write a post",
};

export default async function CreatePostPage() {
  const user = await requireUserOrRedirect("/create");
  const communities = await listUserCommunities(user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Write a post</h1>
        <p className="mt-1 text-sm text-muted">
          Share what you learned. Posts appear in the community you choose.
        </p>
      </header>

      {communities.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="Join a community first"
          description="You can only publish in communities you have joined. Find one that fits your topic, join it, then come back to write."
          action={
            <Link href="/communities" className={buttonClasses("primary", "md")}>
              Browse communities
            </Link>
          }
        />
      ) : (
        <PostForm mode="create" communities={communities} />
      )}
    </div>
  );
}
