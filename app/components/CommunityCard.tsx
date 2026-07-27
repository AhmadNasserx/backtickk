import Link from "next/link";

export default function CommunityCard({
    slug,
    name,
    description,
}: {
    slug: string;
    name: string;
    description: string;
}) {
    return (
        <Link
            href={`/communities/${slug}`}
            className="block border rounded-lg p-4 hover:shadow-md transition"
        >
            <h2 className="font-semibold text-lg">{name}</h2>
            <p className="text-gray-600 text-sm">{description}</p>
        </Link>
    );
}