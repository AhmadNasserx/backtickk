import { communities } from "@/data/communities";
import CommunityCard from "@/app/components/CommunityCard";

export default function CommunitiesPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Communities</h1>
            <p className="text-gray-600 mb-6">Browse developer communities by topic.</p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {communities.map((community) => (
                    <CommunityCard key={community.slug} {...community} />
                ))}
            </div>
        </div>
    );
}