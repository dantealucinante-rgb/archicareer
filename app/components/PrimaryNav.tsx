"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
    { href: "/discover", label: "Discover" },
    { href: "/jobs", label: "Jobs" },
    { href: "/feed", label: "Feed" },
];

export default function PrimaryNav() {
    const pathname = usePathname();

    return (
        <nav aria-label="Primary navigation" className="hidden flex-1 items-center justify-center gap-2 font-sans text-sm sm:flex">
            {links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={`rounded-full px-3 py-2 transition-colors ${active ? "bg-sand/60 text-ink" : "text-graphite hover:bg-sand/40 hover:text-ink"}`}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}
