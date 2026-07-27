import Link from "next/link";

export default function DeveloperCard({
    username,
    role,
}: {
    username: string;
    role: string;
}) {
    return (
        <Link
            href={`/developers/${username}`}
            className="block border rounded-lg p-4 hover:shadow-md transition"
        >
            <h2 className="font-semibold text-lg">{username}</h2>
            <p className="text-gray-600 text-sm">{role}</p>
        </Link>
    );
}