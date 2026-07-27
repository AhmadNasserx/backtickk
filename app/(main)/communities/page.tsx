import Link from "next/link";
import { communities } from "@/data/communities";

export default function CommunitiesPage() {
    return (
        <div>
            <h1>Communities</h1>
            <p>Browse developer communities by topic.</p>

            <ul>
                {communities.map((community) => (
                    <li key={community.slug}>
                        <Link href={`/communities/${community.slug}`}>
                            {community.name}
                        </Link>
                        <p>{community.description}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}