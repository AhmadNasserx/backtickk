import { developers } from "@/data/developers";
import { notFound } from "next/navigation";

export default function DeveloperPage({
    params,
}: {
    params: { username: string };
}) {
    const developer = developers.find((d) => d.username === params.username);

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