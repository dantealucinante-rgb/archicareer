"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
    { href: "/discover", label: "Discover" },
    { href: "/jobs", label: "Jobs" },
    { href: "/feed", label: "Feed" },
    { href: "/pricing", label: "Pricing" },
];

export default function PrimaryNav({ orientation = "horizontal", profileHref }: { orientation?: "horizontal" | "vertical"; profileHref?: string }) {
    const pathname = usePathname();
    const items = profileHref ? [...links, { href: profileHref, label: "Profile" }] : links;

    return (
        <nav aria-label={orientation === "vertical" ? "Feed navigation" : "Primary navigation"} className={orientation === "vertical" ? "hidden flex-col items-stretch gap-1 font-sans text-sm lg:flex" : "hidden flex-1 items-center justify-center gap-2 font-sans text-sm sm:flex"}>
            {items.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={orientation === "vertical"
                            ? `rounded-xl px-4 py-3 font-semibold transition-colors ${active ? "bg-sand text-ink" : "text-graphite hover:bg-sand/60 hover:text-ink"}`
                            : `rounded-full px-3 py-2 transition-colors ${active ? "bg-sand/60 text-ink" : "text-graphite hover:bg-sand/40 hover:text-ink"}`}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}
