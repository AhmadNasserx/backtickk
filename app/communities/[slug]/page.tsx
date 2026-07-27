import { communities } from "@/data/communities";
import { notFound } from "next/navigation";

export default function CommunityPage({
    params,
}: {
    params: { slug: string };
}) {
    const community = communities.find((c) => c.slug === params.slug);

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