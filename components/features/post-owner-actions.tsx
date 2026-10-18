"use client";
// Client island: owner and admin controls depend on the viewer's session, which the cached post page must not read.

import Link from "next/link";
import { useSession } from "next-auth/react";
import { DeletePostButton } from "@/components/features/delete-post-button";
import { buttonClasses } from "@/components/ui/button";

export type PostOwnerActionsProps = {
  postId: string;
  slug: string;
  authorId: string;
};

/** Cosmetic only: the edit page and the DELETE route enforce ownership on the server. */
export function PostOwnerActions({ postId, slug, authorId }: PostOwnerActionsProps) {
  const { data: session, status } = useSession();

  if (status !== "authenticated" || !session) return null;
  const canManage = session.user.id === authorId || session.user.role === "admin";
  if (!canManage) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/blogs/${slug}/edit`} className={buttonClasses("secondary", "sm")}>
        Edit
      </Link>
      <DeletePostButton postId={postId} redirectTo="/blogs" />
    </div>
  );
}
