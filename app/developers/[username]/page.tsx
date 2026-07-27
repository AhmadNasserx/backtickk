import { developers } from "@/data/developers";
import { notFound } from "next/navigation";

export default async function DeveloperPage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;
    const developer = developers.find((d) => d.username === username);

    if (!developer) {
        notFound();
    }

    return (
        <div>
            <h1>{developer.username}</h1>
            <p>{developer.role}</p>
            <p>{developer.bio}</p>
        </div>
    );
}