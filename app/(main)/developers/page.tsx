import { developers } from "@/data/developers";
import DeveloperCard from "@/app/components/DeveloperCard";

export default function DevelopersPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Developers</h1>
            <p className="text-gray-600 mb-6">Meet the developers in our community.</p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {developers.map((dev) => (
                    <DeveloperCard key={dev.username} {...dev} />
                ))}
            </div>
        </div>
    );
}