import Link from "next/link";
import { developers } from "@/data/developers";

export default function DevelopersPage() {
    return (
        <div>
            <h1>Developers</h1>
            <p>Meet the developers in our community.</p>

            <ul>
                {developers.map((dev) => (
                    <li key={dev.username}>
                        <Link href={`/developers/${dev.username}`}>
                            {dev.username}
                        </Link>
                        <p>{dev.role}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}