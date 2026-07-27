import { posts } from "@/data/posts";
import { notFound } from "next/navigation";

export default async function PostPage({
    params,
}: {
    params: Promise<{ username: string; postId: string }>;
}) {
    const { username, postId } = await params;

    const post = posts.find(
        (p) => p.username === username && p.postId === postId
    );

    if (!post) {
        notFound();
    }

    return (
        <div>
            <h1>{post.title}</h1>
            <p>By {post.username}</p>
            <p>{post.content}</p>
        </div>
    );
}