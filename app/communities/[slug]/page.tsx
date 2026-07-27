import { communities } from "@/data/communities";
import { notFound } from "next/navigation";

export default async function CommunityPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const community = communities.find((c) => c.slug === slug);

    if (!community) {
        notFound();
    }

    return (
        <div>
            <h1>{community.name}</h1>
            <p>{community.description}</p>
        </div>
    );
}