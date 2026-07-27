"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/communities", label: "Communities" },
    { href: "/topics", label: "Topics" },
    { href: "/developers", label: "Developers" },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="flex gap-6 px-6 py-4 border-b">
            {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={isActive ? "font-bold text-blue-600" : "text-gray-600"}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}