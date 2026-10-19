// Dynamic: depends on the signed-in user. Only the post's author or an admin may edit it.
import type { Metadata } from "next";
import { forbidden, notFound } from "next/navigation";
import { PostForm } from "@/components/forms/post-form";
import { requireUserOrRedirect } from "@/lib/auth-helpers";
import { listUserCommunities } from "@/lib/data/communities";
import { getPostBySlug } from "@/lib/data/posts";

export const metadata: Metadata = {
  title: "Edit post",
};

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUserOrRedirect(`/blogs/${slug}/edit`);

  const [post, joined] = await Promise.all([getPostBySlug(slug, user), listUserCommunities(user.id)]);
  if (!post) {
    notFound();
  }

  // The PATCH API enforces the same rule; this check only decides what the page shows.
  // forbidden() renders app/forbidden.tsx and responds with HTTP 403.
  if (post.author.id !== user.id && user.role !== "admin") {
    forbidden();
  }

  // Keeps the post's current community selectable even if the author has since left it.
  const communities = joined.some((community) => community.id === post.community.id)
    ? joined
    : [...joined, post.community].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="eyebrow">Editing</p>
        <h1 className="font-display text-3xl leading-tight text-fg sm:text-4xl">Edit post</h1>
        <p className="text-muted">Only the fields you change are saved.</p>
      </header>

      <PostForm
        mode="edit"
        communities={communities}
        initial={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          communityId: post.community.id,
          tags: post.tags,
          coverImage: post.coverImage,
          status: post.status,
        }}
      />
    </div>
  );
}
